from nextgisweb.env import Component, require
from nextgisweb.lib.config import Option


class FormBuilderComponent(Component):
    def initialize(self):
        super(FormBuilderComponent, self).initialize()

    def configure(self):
        super(FormBuilderComponent, self).configure()

    @require("resource")
    def setup_pyramid(self, config):
        from . import api, view

        super(FormBuilderComponent, self).setup_pyramid(config)
        api.setup_pyramid(self, config)
        view.setup_pyramid(self, config)

    def client_settings(self, request):
        return dict(designer=self.options["designer"])

    # fmt: off
    option_annotations = (
        Option("designer", bool, default=False, doc=(
            "Enable experimental form designer UI")),
    )
    # fmt:on
