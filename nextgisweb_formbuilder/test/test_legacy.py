from pathlib import Path
from zipfile import ZipFile

import pytest
import transaction

from nextgisweb.lib.json import loadb

from nextgisweb.vector_layer import VectorLayer

pytestmark = pytest.mark.usefixtures("ngw_resource_defaults", "ngw_auth_administrator")


@pytest.fixture(scope="module")
def vector_layer():
    with transaction.manager:
        res = VectorLayer(geometry_type="POINT").persist()
    return res.id


ELEMENTS = Path(__file__).parent / "data" / "elements"


def ngfp_product():
    for ngfp in ELEMENTS.iterdir():
        with ZipFile(ngfp, "r") as z:
            meta = loadb(z.read("meta.json"))
            form = loadb(z.read("form.json"))
        yield pytest.param(ngfp, meta, form, id=ngfp.stem)


@pytest.mark.parametrize("ngfp, meta, form", ngfp_product())
def test_element(ngfp, meta, form, ngw_file_upload, ngw_webtest_app, vector_layer):
    fu = ngw_file_upload(ngfp)
    resp = ngw_webtest_app.post_json(
        "/api/resource/",
        dict(
            resource=dict(
                cls="formbuilder_form", parent=dict(id=vector_layer), display_name=ngfp.stem
            ),
            formbuilder_form=dict(file_upload=fu),
        ),
        status=201,
    )
    form_id = resp.json["id"]

    resp = ngw_webtest_app.post_json(
        "/api/component/formbuilder/ngfp_convert",
        dict(resource=dict(id=form_id)),
        status=200,
    )
    data = resp.json

    assert data["geometry_type"] == meta["geometry_type"]
    assert len(data["fields"]) == len(meta["fields"])
    assert len(data["items"]) == len(form)
