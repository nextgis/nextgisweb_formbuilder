from nextgisweb.jsrealm import jsentry
from nextgisweb.resource import Widget

from .model import FormbuilderForm


class FormbuilderFormWidget(Widget):
    resource = FormbuilderForm
    operation = ("create", "update")
    amdmod = jsentry("@nextgisweb/formbuilder/form-widget")


def setup_pyramid(comp, config):
    pass
