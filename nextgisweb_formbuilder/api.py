from msgspec import Struct
from sqlalchemy.exc import NoResultFound

from nextgisweb.pyramid.tomb import Configurator, FileResponse, Request, Response
from nextgisweb.resource import (
    DataScope,
    ResourceNotFound,
    ResourceRef,
    ResourceScope,
    resource_factory,
)

from .component import FormBuilderComponent
from .model import FormbuilderForm, FormbuilderFormValue


def formbuilder_form_ngfp(resource: FormbuilderForm, request: Request) -> Response:
    request.resource_permission(ResourceScope.read)

    if (ngfp := resource.value) is not None:
        data = ngfp.to_legacy(resource.display_name)
        response = Response(data)
    elif (ngfp_fileobj := resource.ngfp_fileobj) is not None:
        response = FileResponse(ngfp_fileobj.filename(), request=request)
    else:
        raise NotImplementedError

    response.content_disposition = f"attachment; filename={resource.id}.ngfp"
    return response


class NGFPConvertBody(Struct, kw_only=True):
    resource: ResourceRef


def formbuilder_form_convert(request: Request, *, body: NGFPConvertBody) -> FormbuilderFormValue:
    try:
        res = FormbuilderForm.filter_by(id=body.resource.id).one()
    except NoResultFound:
        raise ResourceNotFound(body.resource.id)

    request.resource_permission(DataScope.read, res)

    if res.value is not None:
        return res.value

    fn = res.ngfp_fileobj.filename()
    return FormbuilderFormValue.from_legacy(fn)


def setup_pyramid(comp: FormBuilderComponent, config: Configurator) -> None:
    config.add_route(
        "formbuilder.formbuilder_form_ngfp",
        "/api/resource/{id:uint}/ngfp",
        factory=resource_factory,
    ).get(formbuilder_form_ngfp, context=FormbuilderForm)

    config.add_route(
        "formbuilder.formbuilder_form_convert",
        "/api/component/formbuilder/ngfp_convert",
        post=formbuilder_form_convert,
    )
