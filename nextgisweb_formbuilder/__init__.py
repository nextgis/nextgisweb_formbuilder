# -*- coding: utf-8 -*-
from __future__ import unicode_literals, print_function, absolute_import

from nextgisweb.component import Component
from .model import Base


class FormBuilderComponent(Component):
    identity = 'formbuilder'
    metadata = Base.metadata

    def initialize(self):
        super(FormBuilderComponent, self).initialize()

    def configure(self):
        super(FormBuilderComponent, self).configure()

    def setup_pyramid(self, config):
        super(FormBuilderComponent, self).setup_pyramid(config)

        from . import view, api
        api.setup_pyramid(self, config)
        view.setup_pyramid(self, config)

def pkginfo():
    return dict(components=dict(formbuilder="nextgisweb_formbuilder"))

def amd_packages():
    return ((
        'ngw-formbuilder', 'nextgisweb_formbuilder:amd/ngw-formbuilder'
    ),)