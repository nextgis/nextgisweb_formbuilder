from nextgisweb.jsrealm import jsentry
from nextgisweb.resource import Widget
from nextgisweb.resource.view import resource_sections

from .model import FormbuilderForm


class FormbuilderFormWidget(Widget):
    resource = FormbuilderForm
    operation = ("create", "update")
    amdmod = jsentry("@nextgisweb/formbuilder/form-widget")


class FormbuilderSettingsWidget(Widget):
    resource = FormbuilderForm
    operation = ("create", "update")
    amdmod = jsentry("@nextgisweb/formbuilder/settings-widget")


@resource_sections("@nextgisweb/formbuilder/resource-section")
def resource_section(obj: FormbuilderForm, **kwargs) -> bool:
    return isinstance(obj, FormbuilderForm) and obj.value is not None
