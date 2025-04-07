from random import randbytes
from shutil import copyfile
from zipfile import ZipFile

import pytest
import transaction

from nextgisweb.vector_layer import VectorLayer

from ..model import NGFP_FILE_SCHEMA, NGFP_MAX_SIZE

pytestmark = pytest.mark.usefixtures("ngw_resource_defaults", "ngw_auth_administrator")


@pytest.fixture(scope="module")
def vector_layer():
    with transaction.manager:
        res = VectorLayer(geometry_type="POINT").persist()
    return res.id


def ngfp_minimal(*, tmp_path, ngw_data_path):
    return ngw_data_path / "minimal.ngfp"


def ngfp_broken(*, tmp_path, ngw_data_path):
    fn = tmp_path / "broken.ngfp"
    copyfile(ngw_data_path / "minimal.ngfp", fn)

    assert fn.stat().st_size > 256
    with fn.open("wb") as fd:
        fd.seek(128)
        fd.write(randbytes(128))

    return fn


def ngfp_empty(*, tmp_path, ngw_data_path):
    fn = tmp_path / "empty.ngfp"
    with ZipFile(fn, mode="w"):
        pass
    return fn


def ngfp_big(*, tmp_path, ngw_data_path):
    fn = tmp_path / "big.ngfp"
    minimal_fn = ngfp_minimal(tmp_path=tmp_path, ngw_data_path=ngw_data_path)
    with ZipFile(fn, mode="a") as zf, ZipFile(minimal_fn, mode="r") as zs:
        for fi in NGFP_FILE_SCHEMA:
            fb = randbytes(NGFP_MAX_SIZE) if fi == "data.geojson" else zs.read(fi)
            zf.writestr(fi, fb)
    return fn


def ngfp_schema(*, tmp_path, ngw_data_path):
    fn = tmp_path / "schema.ngfp"
    minimal_fn = ngfp_minimal(tmp_path=tmp_path, ngw_data_path=ngw_data_path)
    with ZipFile(fn, mode="a") as zf, ZipFile(minimal_fn, mode="r") as zs:
        for fi in NGFP_FILE_SCHEMA:
            fb = b"{}" if fi == "form.json" else zs.read(fi)
            zf.writestr(fi, fb)
    return fn


@pytest.mark.parametrize(
    "name,valid",
    [
        pytest.param("minimal", True, id="minimal"),
        pytest.param("broken", False, id="broken"),
        pytest.param("empty", False, id="empty"),
        pytest.param("schema", False, id="schema"),
        pytest.param("big", False, id="big"),
    ],
)
def test_ngfp(
    name,
    valid,
    vector_layer,
    ngw_file_upload,
    ngw_webtest_app,
    ngw_data_path,
    tmp_path,
):
    fn = globals()[f"ngfp_{name}"](tmp_path=tmp_path, ngw_data_path=ngw_data_path)
    fu = ngw_file_upload(fn)
    ngw_webtest_app.post_json(
        "/api/resource/",
        dict(
            resource=dict(cls="formbuilder_form", parent=dict(id=vector_layer), display_name=name),
            formbuilder_form=dict(file_upload=fu),
        ),
        status=201 if valid else 422,
    )


def get_fields(ngw_webtest_app, flayer_id):
    resp = ngw_webtest_app.get(f"/api/resource/{flayer_id}", status=200)
    return resp.json["feature_layer"]["fields"]


def test_struct(vector_layer, ngw_webtest_app):
    value = {
        "geometry_type": "POINT",
        "fields": [
            {"keyname": "f1", "datatype": "STRING", "display_name": "dnf1"},
            {"keyname": "f2", "datatype": "INTEGER", "display_name": "dnf2"},
        ],
        "items": [
            {"type": "label", "label": "Field 1"},
            {"type": "textbox", "field": "f1", "remember": False},
            {
                "type": "tabs",
                "tabs": [
                    {
                        "title": "Tab 1",
                        "active": False,
                        "items": [
                            {"type": "checkbox", "field": "f2", "label": "F1", "remember": False},
                        ],
                    },
                    {
                        "title": "Tab 2",
                        "active": True,
                        "items": [
                            {"type": "checkbox", "field": "f2", "label": "F2", "remember": False},
                        ],
                    },
                ],
            },
        ],
    }

    resp = ngw_webtest_app.post_json(
        "/api/resource/",
        dict(
            resource=dict(
                cls="formbuilder_form",
                parent=dict(id=vector_layer),
                display_name="struct",
            ),
            formbuilder_form=dict(value=value),
        ),
        status=201,
    )

    ngw_webtest_app.get(f"/api/resource/{resp.json['id']}/ngfp", status=200)

    fields = get_fields(ngw_webtest_app, vector_layer)
    assert len(fields) == 0


def test_fields_update(vector_layer, ngw_webtest_app):
    form_fields = [
        {"keyname": "f1", "datatype": "STRING", "display_name": "dnf1"},
        {"keyname": "f2", "datatype": "INTEGER", "display_name": "dnf2"},
    ]
    value = {
        "geometry_type": "POINT",
        "fields": form_fields,
        "items": [],
    }

    ngw_webtest_app.post_json(
        "/api/resource/",
        dict(
            resource=dict(
                cls="formbuilder_form",
                parent=dict(id=vector_layer),
                display_name="fields",
            ),
            formbuilder_form=dict(
                value=value,
                update_feature_layer_fields=True,
            ),
        ),
        status=201,
    )
