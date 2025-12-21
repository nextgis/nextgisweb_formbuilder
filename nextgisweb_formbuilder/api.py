from msgspec import Struct
from pyramid.response import FileResponse, Response
from sqlalchemy.exc import NoResultFound

from nextgisweb.resource import (
    DataScope,
    ResourceNotFound,
    ResourceRef,
    ResourceScope,
    resource_factory,
)

from .model import FormbuilderForm, FormbuilderFormValue


def formbuilder_form_ngfp(resource, request):
    request.resource_permission(ResourceScope.read)

    if ngfp := resource.value:
        data = ngfp.to_legacy(resource.display_name)
        response = Response(data)
    else:
        response = FileResponse(resource.ngfp_fileobj.filename(), request=request)

    response.content_disposition = "attachment; filename=%d.ngfp" % resource.id
    return response


class NGFPConvertBody(Struct, kw_only=True):
    resource: ResourceRef


def formbuilder_form_convert(request, *, body: NGFPConvertBody) -> FormbuilderFormValue:
    try:
        res = FormbuilderForm.filter_by(id=body.resource.id).one()
    except NoResultFound:
        raise ResourceNotFound(body.resource.id)

    request.resource_permission(DataScope.read, res)

    if res.value is not None:
        return res.value

    fn = res.ngfp_fileobj.filename()
    return FormbuilderFormValue.from_legacy(fn)


def setup_pyramid(comp, config):
    config.add_route(
        "formbuilder.formbuilder_form_ngfp",
        "/api/resource/{id:uint}/ngfp",
        factory=resource_factory,
    ).get(formbuilder_form_ngfp, context=FormbuilderForm)

    config.add_route(
        "formbuilder.formbuilder_form_convert",
        "/api/component/formbuilder/ngfp_convert",
    ).post(formbuilder_form_convert)
