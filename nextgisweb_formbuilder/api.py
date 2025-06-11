from io import BytesIO
from zipfile import ZIP_DEFLATED, ZipFile

from msgspec import Struct
from pyramid.response import FileResponse, Response
from sqlalchemy.orm.exc import NoResultFound

from nextgisweb.lib.json import dumpb, loadb

from nextgisweb.resource import (
    DataScope,
    ResourceNotFound,
    ResourceRef,
    ResourceScope,
    resource_factory,
)

from .element import FormbuilderItem
from .model import FormbuilderForm, FormbuilderFormValue


def formbuilder_form_ngfp(resource, request):
    request.resource_permission(ResourceScope.read)

    if ngfp := resource.value:
        buf = BytesIO()
        with ZipFile(buf, "w", ZIP_DEFLATED) as zf:
            meta = dict(
                version="2.2",
                name=resource.display_name,
                geometry_type=ngfp.geometry_type,
                fields=ngfp.fields,
                translations=[],
                srs=dict(id=4326),
                ngw_connection=None,
                lists=None,
                key_list=None,
            )
            zf.writestr("meta.json", dumpb(meta))
            items = [i.to_legacy() for i in ngfp.items]
            zf.writestr("form.json", dumpb(items))
            zf.writestr("data.geojson", "")
        response = Response(buf.getvalue())

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
    with ZipFile(fn, "r") as z:
        meta = loadb(z.read("meta.json"))
        form = loadb(z.read("form.json"))

    items = []
    for fi in form:
        if fi["type"] in ("counter", "signature"):
            continue
        items.append(FormbuilderItem.from_legacy(fi))

    return FormbuilderFormValue(
        geometry_type=meta["geometry_type"],
        fields=meta["fields"],
        items=items,
    )


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
