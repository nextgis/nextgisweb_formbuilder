from nextgisweb.env import Base, gettext
from nextgisweb.lib import db

from nextgisweb.feature_layer import IFeatureLayer
from nextgisweb.file_storage import FileObj
from nextgisweb.file_upload import FileUpload
from nextgisweb.resource import DataScope, Resource, ResourceScope, SerializedProperty, Serializer
from nextgisweb.resource.category import FieldDataCollectionCategory


class FormbuilderForm(Base, Resource):
    identity = "formbuilder_form"
    cls_display_name = gettext("Form")
    cls_category = FieldDataCollectionCategory

    __scope__ = DataScope

    ngfp_fileobj_id = db.Column(db.ForeignKey(FileObj.id), nullable=True)
    ngfp_fileobj = db.relationship(FileObj, cascade="all")

    @classmethod
    def check_parent(cls, parent):
        return IFeatureLayer.providedBy(parent)

    @property
    def feature_layer(self):
        return self.parent

    @property
    def srs(self):
        return self.parent.srs


class _file_upload_attr(SerializedProperty):
    def setter(self, srlzr, value):
        fupload = FileUpload(id=value["id"])
        srlzr.obj.ngfp_fileobj = fupload.to_fileobj()


class FormbuilderFormSerializer(Serializer):
    identity = FormbuilderForm.identity
    resclass = FormbuilderForm

    file_upload = _file_upload_attr(read=None, write=ResourceScope.update)
