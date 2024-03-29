from pyramid.response import FileResponse

from nextgisweb.resource import ResourceScope, resource_factory

from .model import FormbuilderForm


def formbuilder_form_ngfp(resource, request):
    request.resource_permission(ResourceScope.read)

    response = FileResponse(resource.ngfp_fileobj.filename(), request=request)
    response.content_disposition = "attachment; filename=%d.ngfp" % resource.id

    return response


def setup_pyramid(comp, config):
    config.add_route(
        "formbuilder.formbuilder_form_ngfp",
        "/api/resource/{id:uint}/ngfp",
        factory=resource_factory,
    ).get(formbuilder_form_ngfp, context=FormbuilderForm)
