import math
from io import BytesIO
from pathlib import Path
from typing import Any, Dict, List, Union
from zipfile import ZIP_DEFLATED, BadZipFile, ZipFile

import sqlalchemy as sa
import sqlalchemy.orm as orm
from msgspec import UNSET, Struct, UnsetType
from msgspec import DecodeError as MsgspecDecodeErrror
from msgspec import ValidationError as MsgspecValidationError
from msgspec.json import decode as msgspec_json_decode

from nextgisweb.env import gettext, gettextf, ngettextf
from nextgisweb.lib.json import dumpb, loadb
from nextgisweb.lib.saext import Msgspec

from nextgisweb.core.exception import InsufficientPermissions, ValidationError
from nextgisweb.feature_layer import (
    FIELD_TYPE,
    FeatureLayerFieldDatatype,
    FeatureLayerGeometryType,
    IFeatureLayer,
    IFieldEditableFeatureLayer,
)
from nextgisweb.file_storage import FileObj
from nextgisweb.file_upload import FileUploadRef
from nextgisweb.resource import DataScope, Resource, ResourceScope, SAttribute, Serializer
from nextgisweb.resource.category import FieldDataCollectionCategory

from .element import (
    FieldKeyname,
    FormbuilderFormItemUnion,
    FormbuilderItem,
)


class FormbuilderField(Struct):
    keyname: FieldKeyname
    display_name: str
    datatype: FeatureLayerFieldDatatype


class FormbuilderFormValue(Struct, kw_only=True):
    geometry_type: FeatureLayerGeometryType
    fields: List[FormbuilderField]
    items: List[FormbuilderFormItemUnion]

    def validate(self):
        fields_mapping: dict[str, FormbuilderField] = {}
        seen_kn: set[str] = set()
        seen_dn: set[str] = set()

        for field in self.fields:
            if (kn := field.keyname) in seen_kn:
                msg = gettextf("Duplicate keyname '{}' found in fields.").format(kn)
                raise ValidationError(msg)
            seen_kn.add(kn)

            if (dn := field.display_name) in seen_dn:
                msg = gettextf("Duplicate display name '{}' found in fields.").format(dn)
                raise ValidationError(msg)
            seen_dn.add(dn)

            fields_mapping[kn] = field

        fields_unbound = set(fields_mapping.keys())
        fields_bound = set()

        def bind_field(
            keyname: FieldKeyname,
            datatypes: tuple[FeatureLayerFieldDatatype, ...],
        ) -> None:
            field = fields_mapping.get(keyname)
            if field is None:
                raise ValidationError(gettextf("Unknown field '{}'.").format(keyname))

            if keyname in fields_bound:
                raise ValidationError(
                    gettextf(
                        "The '{dn}' field (keyname '{kn}') is bound to two or "
                        "more form elements. Each field can only be bound to "
                        "a single element."
                    ).format(
                        kn=keyname,
                        dn=field.display_name,
                    )
                )

            if field.datatype not in datatypes:
                msg = gettextf(
                    "The {dt} data type of the '{dn}' field (keyname '{kn}') "
                    "is not compatible with the element."
                ).format(kn=keyname, dn=field.display_name, dt=field.datatype)
                msg += ngettextf(
                    "The element requires a field of type {}.",
                    "The element requires a field of one of these types: {}.",
                    len(datatypes),
                ).format(", ".join(datatypes))
                raise ValidationError(msg)

            fields_unbound.remove(keyname)
            fields_bound.add(keyname)

        for elem in self.items:
            elem.validate(bind_field=bind_field)

        if len(fields_unbound) > 0:
            kn = tuple(fields_unbound)[0]
            dn = fields_mapping[kn].display_name
            raise ValidationError(
                gettextf(
                    "The '{dn}' field (keyname '{kn}') is not bound to any "
                    "element and must be removed from the form."
                ).format(kn=kn, dn=dn)
            )

    def field_by_keyname(self, keyname):
        for f in self.fields:
            if f.keyname == keyname:
                return f
        raise KeyError

    @classmethod
    def from_legacy(cls, filename) -> "FormbuilderFormValue":
        with ZipFile(filename, "r") as z:
            meta = loadb(z.read("meta.json"))
            form = loadb(z.read("form.json"))

        items = [FormbuilderItem.from_legacy(i) for i in form]

        return cls(
            geometry_type=meta["geometry_type"],
            fields=meta["fields"],
            items=items,
        )

    def to_legacy(self, name: str) -> bytes:
        buf = BytesIO()
        with ZipFile(buf, "w", ZIP_DEFLATED) as zf:
            meta = dict(
                version="2.2",
                name=name,
                geometry_type=self.geometry_type,
                fields=self.fields,
                translations=[],
                srs=dict(id=4326),
                ngw_connection=None,
                lists=None,
                key_list=None,
            )
            zf.writestr("meta.json", dumpb(meta, pretty=True))

            legacy_items = [i.to_legacy() for i in self.items]
            self.legacy_items_extra(legacy_items)
            zf.writestr("form.json", dumpb(legacy_items, pretty=True))

            zf.writestr("data.geojson", "")

        return buf.getvalue()

    def legacy_items_extra(self, legacy_items: List[Dict[str, Any]]):
        for li in legacy_items:
            if li["type"] == "tabs":
                for p in li["pages"]:
                    self.legacy_items_extra(p["elements"])
            elif li["type"] == "text_edit":
                attrs = li["attributes"]
                field = self.field_by_keyname(attrs["field"])
                is_number = field.datatype in (
                    FIELD_TYPE.INTEGER,
                    FIELD_TYPE.BIGINT,
                    FIELD_TYPE.REAL,
                )
                attrs["only_figures"] = is_number
                if is_number and (text := attrs["text"]) != "":
                    is_real = field.datatype == FIELD_TYPE.REAL
                    if not _check_number(text, is_real):
                        attrs["text"] = ""


NGFP_MAX_SIZE = 10 * 1 << 20
NGFP_FILE_SCHEMA: Dict[str, Any] = {
    "meta.json": Dict,
    "form.json": List[Dict],
    "data.geojson": None,
}

NGFP_FILES = {"meta.json", "form.json", "data.geojson"}


class FormbuilderForm(Resource):
    identity = "formbuilder_form"
    cls_display_name = gettext("Form")
    cls_category = FieldDataCollectionCategory

    __scope__ = DataScope

    value = sa.Column(Msgspec(FormbuilderFormValue), nullable=True)
    ngfp_fileobj_id = sa.Column(sa.ForeignKey(FileObj.id), nullable=True)

    __table_args__ = (sa.CheckConstraint("(value IS NULL) != (ngfp_fileobj_id IS NULL)"),)

    ngfp_fileobj = orm.relationship(FileObj, cascade="all")

    @classmethod
    def check_parent(cls, parent):
        return IFeatureLayer.providedBy(parent)

    @property
    def feature_layer(self):
        return self.parent

    @property
    def srs(self):
        return self.parent.srs


def validate_ngfp_file(file: Path):
    msg_generic = gettext("Invalid NGFP file.")
    msg_size = gettextf("NGFP file size exceeds {} bytes.")

    try:
        with ZipFile(file, mode="r") as zf:
            if set(zf.namelist()) != set(NGFP_FILE_SCHEMA.keys()):
                raise ValidationError(msg_generic)

            if file.stat().st_size > NGFP_MAX_SIZE:
                raise ValidationError(msg_size(NGFP_MAX_SIZE))

            for fn, fs in NGFP_FILE_SCHEMA.items():
                zi = zf.getinfo(fn)
                if zi.file_size > NGFP_MAX_SIZE:
                    raise ValidationError(msg_size(NGFP_MAX_SIZE))

                if fs is not None:
                    with zf.open(zi, mode="r") as fd:
                        msgspec_json_decode(fd.read(), type=fs)
    except (BadZipFile, MsgspecDecodeErrror, MsgspecValidationError):
        raise ValidationError(msg_generic)


class ValueAttr(SAttribute):
    def get(self, srlzr: Serializer) -> Union[FormbuilderFormValue, None]:
        return super().get(srlzr)

    def set(self, srlzr: Serializer, value: FormbuilderFormValue, *, create: bool):
        value.validate()
        srlzr.obj.value = value
        srlzr.obj.ngfp_fileobj = None


class FileUploadAttr(SAttribute):
    def set(self, srlzr: Serializer, value: FileUploadRef, *, create: bool):
        file = value()
        validate_ngfp_file(file.data_path)
        srlzr.obj.ngfp_fileobj = file.to_fileobj()
        srlzr.obj.value = None


class UpdateFieldsAttr(SAttribute):
    def set(self, srlzr: Serializer, value: Union[bool, UnsetType], *, create: bool):
        if value is True:
            parent = srlzr.obj.parent
            if not IFieldEditableFeatureLayer.providedBy(parent):
                raise ValidationError
            if not parent.has_permission(ResourceScope.update, srlzr.user):
                raise InsufficientPermissions
            for form_field in srlzr.obj.value.fields:
                try:
                    parent.field_by_keyname(form_field.keyname)
                except KeyError:
                    field = parent.field_create(form_field.datatype)
                    field.keyname = form_field.keyname
                    field.display_name = form_field.display_name
                    parent.fields.append(field)


class FormbuilderFormSerializer(Serializer, resource=FormbuilderForm):
    value = ValueAttr(read=ResourceScope.read, write=ResourceScope.update)
    file_upload = FileUploadAttr(write=ResourceScope.update)
    update_feature_layer_fields = UpdateFieldsAttr(write=ResourceScope.update)

    def deserialize(self):
        if self.data.value is not UNSET and self.data.file_upload is not UNSET:
            raise ValidationError("'value' and 'file_upload' attributes should not pass together.")
        super().deserialize()


def _check_number(text: str, is_real: bool) -> bool:
    if is_real:
        try:
            v = float(text)
        except ValueError:
            return False
        return math.isfinite(v)

    try:
        int(text)
    except ValueError:
        return False
    return True
