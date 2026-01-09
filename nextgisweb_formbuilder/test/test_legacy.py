from pathlib import Path
from zipfile import ZipFile

import pytest
import transaction

from nextgisweb.lib.json import loadb

from nextgisweb.pyramid.test import WebTestApp
from nextgisweb.resource.test import ResourceAPI
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
def test_element(ngfp, meta, form, vector_layer, ngw_file_upload, ngw_webtest_app: WebTestApp):
    rapi = ResourceAPI()
    fu = ngw_file_upload(ngfp)

    form_id = rapi.create(
        "formbuilder_form",
        {
            "resource": {"parent": {"id": vector_layer}},
            "formbuilder_form": {"file_upload": fu},
        },
    )

    data = ngw_webtest_app.post(
        "/api/component/formbuilder/ngfp_convert",
        json={"resource": {"id": form_id}},
        status=200,
    ).json

    assert data["geometry_type"] == meta["geometry_type"]
    assert len(data["fields"]) == len(meta["fields"])
    assert len(data["items"]) == len(form)
