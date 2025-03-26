from pathlib import Path
from typing import TYPE_CHECKING, Any, ClassVar, Dict, List, Type, TypeVar, Union
from zipfile import BadZipFile, ZipFile

import sqlalchemy as sa
import sqlalchemy.orm as orm
from msgspec import UNSET, Struct
from msgspec import DecodeError as MsgspecDecodeErrror
from msgspec import ValidationError as MsgspecValidationError
from msgspec.json import decode as msgspec_json_decode
from typing_extensions import Annotated

from nextgisweb.env import Base, gettext, gettextf
from nextgisweb.lib.saext import Msgspec

from nextgisweb.core.exception import ValidationError
from nextgisweb.feature_layer import (
    FeatureLayerFieldDatatype,
    FeaureLayerGeometryType,
    IFeatureLayer,
)
from nextgisweb.file_storage import FileObj
from nextgisweb.file_upload import FileUploadRef
from nextgisweb.jsrealm import TSExport
from nextgisweb.resource import DataScope, Resource, ResourceScope, SAttribute, Serializer
from nextgisweb.resource.category import FieldDataCollectionCategory


class FormbuilderField(Struct):
    keyname: str
    display_name: str
    datatype: FeatureLayerFieldDatatype


T = TypeVar("T", bound=Type["FormbuilderItem"])


class FormbuilderItem(Struct, kw_only=True):
    registry: ClassVar[list[Type["FormbuilderItem"]]] = list()
    legacy_type: ClassVar[str]

    @classmethod
    def register(cls, item: T) -> T:
        cls.registry.append(item)
        return item

    def to_legacy(self) -> Dict[str, Any]:
        return dict(type=self.legacy_type, attributes=dict())


@FormbuilderItem.register
class FormbuilderLabelItem(FormbuilderItem, tag="label"):
    legacy_type = "text"

    label: str

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["attributes"]["text"] = self.label
        return result


class FormbuilderTab(Struct):
    title: str
    active: bool
    items: List["FormbuilderFormItemUnion"]

    def to_legacy(self) -> Dict[str, Any]:
        result: Dict[str, Any] = dict(caption=self.title)
        if self.active:
            result["default"] = True
        result["elements"] = [i.to_legacy() for i in self.items]
        return result


@FormbuilderItem.register
class FormbuilderTabsItem(FormbuilderItem, tag="tabs"):
    legacy_type = "tabs"

    tabs: List[FormbuilderTab]

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["pages"] = [t.to_legacy() for t in self.tabs]
        return result


class FormbuilderFieldItem(FormbuilderItem):
    field: str

    remember: bool

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["attributes"].update(
            {
                "field": self.field,
                "last": self.remember,
            }
        )
        return result


@FormbuilderItem.register
class FormbuilderTextboxItem(FormbuilderFieldItem, tag="textbox", kw_only=True):
    legacy_type = "text_edit"

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["attributes"].update(
            {
                "init_value": "",
                "max_string_count": 1,
                "ngid_login": False,
                "ngw_login": False,
                "only_figures": False,
            }
        )
        return result


@FormbuilderItem.register
class FormbuilderCheckboxItem(FormbuilderFieldItem, tag="checkbox", kw_only=True):
    legacy_type = "checkbox"

    label: str

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["attributes"].update(
            {
                "init_value": False,
                "text": self.label,
            }
        )
        return result


if TYPE_CHECKING:
    FormbuilderFormItemUnion = FormbuilderItem
else:
    FormbuilderFormItemUnion = Annotated[
        Union[tuple(FormbuilderItem.registry)],
        TSExport("FormbuilderFormItem"),
    ]


class FormbuilderFormValue(Struct, kw_only=True):
    geometry_type: FeaureLayerGeometryType
    fields: List[FormbuilderField]
    items: List[FormbuilderFormItemUnion]


NGFP_MAX_SIZE = 10 * 1 << 20
NGFP_FILE_SCHEMA: Dict[str, Any] = {
    "meta.json": Dict,
    "form.json": List[Dict],
    "data.geojson": None,
}

NGFP_FILES = {"meta.json", "form.json", "data.geojson"}


class FormbuilderForm(Base, Resource):
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
        srlzr.obj.value = value
        srlzr.obj.ngfp_fileobj = None


class FileUploadAttr(SAttribute):
    def set(self, srlzr: Serializer, value: FileUploadRef, *, create: bool):
        file = value()
        validate_ngfp_file(file.data_path)
        srlzr.obj.ngfp_fileobj = file.to_fileobj()
        srlzr.obj.value = None


class FormbuilderFormSerializer(Serializer, resource=FormbuilderForm):
    value = ValueAttr(read=ResourceScope.read, write=ResourceScope.update)
    file_upload = FileUploadAttr(read=None, write=ResourceScope.update)

    def deserialize(self):
        if self.data.value is not UNSET and self.data.file_upload is not UNSET:
            raise ValidationError("'value' and 'file_upload' attributes should not pass together.")
        super().deserialize()
