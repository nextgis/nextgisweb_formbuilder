from nextgisweb.env import Component, require


class FormBuilderComponent(Component):

    def initialize(self):
        super(FormBuilderComponent, self).initialize()

    def configure(self):
        super(FormBuilderComponent, self).configure()

    @require('resource')
    def setup_pyramid(self, config):
        super(FormBuilderComponent, self).setup_pyramid(config)

        from . import api, view
        api.setup_pyramid(self, config)
        view.setup_pyramid(self, config)
