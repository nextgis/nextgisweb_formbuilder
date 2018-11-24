# -*- coding: utf-8 -*-
from __future__ import unicode_literals, print_function, absolute_import

from nextgisweb.resource import Widget, Resource
import nextgisweb.dynmenu as dm

from .model import FormbuilderForm
from .util import _


class Widget(Widget):
    resource = FormbuilderForm
    operation = ('create', 'update')
    amdmod = 'ngw-formbuilder/FormbuilderFormWidget'


def setup_pyramid(comp, config):
    class LayerMenuExt(dm.DynItem):

        def build(self, args):
            if isinstance(args.obj, FormbuilderForm):
                yield dm.Label('formbuilder_form', _(u"Form"))

                if args.obj.ngfp_fileobj is not None:
                    yield dm.Link(
                        'formbuilder_form/ngfp', _(u"Download as NGFP"),
                        lambda args: args.request.route_url(
                            "formbuilder.formbuilder_form_ngfp", id=args.obj.id))

    Resource.__dynmenu__.add(LayerMenuExt())
