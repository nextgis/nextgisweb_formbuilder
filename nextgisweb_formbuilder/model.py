import sqlalchemy as sa
import sqlalchemy.orm as orm

from nextgisweb.env import Base, gettext

from nextgisweb.feature_layer import IFeatureLayer
from nextgisweb.file_storage import FileObj
from nextgisweb.file_upload import FileUploadRef
from nextgisweb.resource import DataScope, Resource, ResourceScope, SAttribute, Serializer
from nextgisweb.resource.category import FieldDataCollectionCategory


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


class FileUploadAttr(SAttribute, apitype=True):
    def set(self, srlzr: Serializer, value: FileUploadRef, *, create: bool):
        srlzr.obj.ngfp_fileobj = value().to_fileobj()


class FormbuilderFormSerializer(Serializer, resource=FormbuilderForm):
    file_upload = FileUploadAttr(read=None, write=ResourceScope.update)
