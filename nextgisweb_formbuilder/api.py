# -*- coding: utf-8 -*-
from __future__ import division, absolute_import, print_function, unicode_literals

from pyramid.response import FileResponse

from nextgisweb.env import env
from nextgisweb.resource import resource_factory, ResourceScope

from .model import FormbuilderForm


def formbuilder_form_ngfp(resource, request):
    request.resource_permission(ResourceScope.read)

    fn = env.file_storage.filename(resource.ngfp_fileobj)

    response = FileResponse(fn, request=request)
    response.content_disposition = 'attachment; filename=%d.ngfp' % resource.id

    return response


def setup_pyramid(comp, config):
    config.add_route(
        'formbuilder.formbuilder_form_ngfp', '/api/resource/{id}/ngfp',
        factory=resource_factory
    ).add_view(formbuilder_form_ngfp, context=FormbuilderForm, request_method='GET')
