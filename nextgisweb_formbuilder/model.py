from shutil import copyfile

from nextgisweb.env import COMP_ID, Base, _, env
from nextgisweb.lib import db

from nextgisweb.feature_layer import IFeatureLayer
from nextgisweb.file_storage import FileObj
from nextgisweb.resource import DataScope, Resource, ResourceScope, SerializedProperty, Serializer


class FormbuilderForm(Base, Resource):
    identity = 'formbuilder_form'
    cls_display_name = _("Form")

    __scope__ = DataScope

    ngfp_fileobj_id = db.Column(db.ForeignKey(FileObj.id), nullable=True)
    ngfp_fileobj = db.relationship(FileObj, cascade='all')

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
        srcfile, _ = env.file_upload.get_filename(value['id'])
        fileobj = env.file_storage.fileobj(component=COMP_ID)
        srlzr.obj.ngfp_fileobj = fileobj
        dstfile = env.file_storage.filename(fileobj, makedirs=True)

        copyfile(srcfile, dstfile)


class FormbuilderFormSerializer(Serializer):
    identity = FormbuilderForm.identity
    resclass = FormbuilderForm

    file_upload = _file_upload_attr(read=None, write=ResourceScope.update)
