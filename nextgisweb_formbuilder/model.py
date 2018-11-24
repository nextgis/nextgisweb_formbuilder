# -*- coding: utf-8 -*-
from __future__ import unicode_literals, print_function, absolute_import

from shutil import copyfileobj

from nextgisweb import db
from nextgisweb.models import declarative_base
from nextgisweb.env import env
from nextgisweb.resource import (
    Resource,
    ResourceScope,
    DataScope,
    Serializer,
    SerializedProperty)
from nextgisweb.feature_layer import IFeatureLayer
from nextgisweb.file_storage import FileObj

from .util import _

Base = declarative_base()


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


class _file_upload_attr(SerializedProperty):  # NOQA

    def setter(self, srlzr, value):
        srcfile, _ = env.file_upload.get_filename(value['id'])
        fileobj = env.file_storage.fileobj(component='formbuilder')
        srlzr.obj.ngfp_fileobj = fileobj
        dstfile = env.file_storage.filename(fileobj, makedirs=True)

        with open(srcfile, 'r') as fs, open(dstfile, 'w') as fd:
            copyfileobj(fs, fd)


class FormbuilderFormSerializer(Serializer):
    identity = FormbuilderForm.identity
    resclass = FormbuilderForm

    file_upload = _file_upload_attr(read=None, write=ResourceScope.update)
