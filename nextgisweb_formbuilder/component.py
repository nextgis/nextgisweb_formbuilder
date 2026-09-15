from nextgisweb.env import Component, require


class FormBuilderComponent(Component):
    @require("resource")
    def setup_pyramid(self, config):
        from . import api, view

        api.setup_pyramid(self, config)
        view.setup_pyramid(self, config)
