import nextgisweb.lib.dynmenu as dm
from nextgisweb.env import _

from nextgisweb.resource import Resource, Widget

from .model import FormbuilderForm


class Widget(Widget):
    resource = FormbuilderForm
    operation = ('create', 'update')
    amdmod = '@nextgisweb/formbuilder/editor-widget'


def setup_pyramid(comp, config):
    class LayerMenuExt(dm.DynItem):

        def build(self, args):
            if isinstance(args.obj, FormbuilderForm):
                yield dm.Label('formbuilder_form', _("Form"))

                if args.obj.ngfp_fileobj is not None:
                    yield dm.Link(
                        'formbuilder_form/ngfp', _("Download as NGFP"),
                        lambda args: args.request.route_url(
                            "formbuilder.formbuilder_form_ngfp", id=args.obj.id))

    Resource.__dynmenu__.add(LayerMenuExt())
