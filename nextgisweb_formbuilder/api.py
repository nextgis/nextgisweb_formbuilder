from io import BytesIO
from zipfile import ZIP_DEFLATED, ZipFile

from pyramid.response import FileResponse, Response

from nextgisweb.lib.json import dumpb

from nextgisweb.resource import ResourceScope, resource_factory

from .model import FormbuilderForm


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


def setup_pyramid(comp, config):
    config.add_route(
        "formbuilder.formbuilder_form_ngfp",
        "/api/resource/{id:uint}/ngfp",
        factory=resource_factory,
    ).get(formbuilder_form_ngfp, context=FormbuilderForm)
