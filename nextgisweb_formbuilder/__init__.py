from nextgisweb.env import Component, require
from .model import Base


class FormBuilderComponent(Component):
    identity = 'formbuilder'
    metadata = Base.metadata

    def initialize(self):
        super(FormBuilderComponent, self).initialize()

    def configure(self):
        super(FormBuilderComponent, self).configure()

    @require('resource')
    def setup_pyramid(self, config):
        super(FormBuilderComponent, self).setup_pyramid(config)

        from . import view, api
        api.setup_pyramid(self, config)
        view.setup_pyramid(self, config)


def pkginfo():
    return dict(components=dict(formbuilder="nextgisweb_formbuilder"))
