import nextgisweb.lib.dynmenu as dm
from nextgisweb.env import gettext

from nextgisweb.jsrealm import jsentry
from nextgisweb.resource import Resource, Widget

from .model import FormbuilderForm


class FormbuilderFormWidget(Widget):
    resource = FormbuilderForm
    operation = ("create", "update")
    amdmod = jsentry("@nextgisweb/formbuilder/form-widget")


def setup_pyramid(comp, config):
    class LayerMenuExt(dm.DynItem):
        def build(self, args):
            if isinstance(args.obj, FormbuilderForm):
                yield dm.Label("formbuilder_form", gettext("Form"))

                yield dm.Link(
                    "formbuilder_form/ngfp",
                    gettext("Download as NGFP"),
                    lambda args: args.request.route_url(
                        "formbuilder.formbuilder_form_ngfp", id=args.obj.id
                    ),
                )

    Resource.__dynmenu__.add(LayerMenuExt())
