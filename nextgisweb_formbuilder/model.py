from pathlib import Path
from typing import Any, Dict, List
from zipfile import BadZipFile, ZipFile

import sqlalchemy as sa
import sqlalchemy.orm as orm
from msgspec import DecodeError as MsgspecDecodeErrror
from msgspec import ValidationError as MsgspecValidationError
from msgspec.json import decode as msgspec_json_decode

from nextgisweb.env import Base, gettext, gettextf

from nextgisweb.core.exception import ValidationError
from nextgisweb.feature_layer import IFeatureLayer
from nextgisweb.file_storage import FileObj
from nextgisweb.file_upload import FileUploadRef
from nextgisweb.resource import DataScope, Resource, ResourceScope, SAttribute, Serializer
from nextgisweb.resource.category import FieldDataCollectionCategory

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

    ngfp_fileobj_id = sa.Column(sa.ForeignKey(FileObj.id), nullable=True)

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


class FileUploadAttr(SAttribute):
    def set(self, srlzr: Serializer, value: FileUploadRef, *, create: bool):
        file = value()
        validate_ngfp_file(file.data_path)
        srlzr.obj.ngfp_fileobj = file.to_fileobj()


class FormbuilderFormSerializer(Serializer, resource=FormbuilderForm):
    file_upload = FileUploadAttr(read=None, write=ResourceScope.update)
