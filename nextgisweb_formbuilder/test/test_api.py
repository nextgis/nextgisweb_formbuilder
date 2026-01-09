from random import randbytes
from shutil import copyfile
from zipfile import ZipFile

import pytest
import transaction

from nextgisweb.resource.test import ResourceAPI
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
def test_ngfp(name, valid, vector_layer, ngw_file_upload, ngw_data_path, tmp_path):
    rapi = ResourceAPI()
    fn = globals()[f"ngfp_{name}"](tmp_path=tmp_path, ngw_data_path=ngw_data_path)
    fu = ngw_file_upload(fn)

    rapi.create_request(
        "formbuilder_form",
        {
            "resource": {"parent": {"id": vector_layer}},
            "formbuilder_form": {"file_upload": fu},
        },
        status=201 if valid else 422,
    )


def get_fields(rapi: ResourceAPI, res_id: int):
    return rapi.read(res_id)["feature_layer"]["fields"]


def test_struct(vector_layer):
    rapi = ResourceAPI()

    value = {
        "geometry_type": "POINT",
        "fields": [
            {"keyname": "f1", "datatype": "STRING", "display_name": "F1"},
            {"keyname": "f2", "datatype": "INTEGER", "display_name": "F2"},
            {"keyname": "f3", "datatype": "INTEGER", "display_name": "F3"},
            {"keyname": "f4", "datatype": "DATE", "display_name": "F4"},
            {"keyname": "f5", "datatype": "TIME", "display_name": "F5"},
            {"keyname": "f6", "datatype": "DATETIME", "display_name": "F6"},
            {"keyname": "f7", "datatype": "DATETIME", "display_name": "F7"},
        ],
        "items": [
            {"type": "label", "label": "Field 1"},
            {
                "type": "textbox",
                "field": "f1",
                "remember": False,
                "max_lines": 1,
            },
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
                            {"type": "checkbox", "field": "f3", "label": "F3", "remember": False},
                        ],
                    },
                ],
            },
            {
                "type": "datetime",
                "field": "f4",
                "remember": False,
                "datetime": "date",
                "initial": "2025-04-26",
            },
            {
                "type": "datetime",
                "field": "f5",
                "remember": False,
                "datetime": "time",
                "initial": "16:21:45",
            },
            {
                "type": "datetime",
                "field": "f6",
                "remember": False,
                "datetime": "datetime",
                "initial": "2025-04-26T16:21:45",
            },
            {
                "type": "datetime",
                "field": "f7",
                "remember": False,
                "datetime": "datetime",
                "initial": "CURRENT",
            },
        ],
    }

    res_id = rapi.create(
        "formbuilder_form",
        {
            "resource": {"parent": {"id": vector_layer}},
            "formbuilder_form": {"value": value},
        },
    )

    rapi.client.get(f"{res_id}/ngfp", status=200)

    fields = get_fields(rapi, vector_layer)
    assert len(fields) == 0


def test_fields_update(vector_layer):
    rapi = ResourceAPI()

    form_fields = [
        {"keyname": "f1", "datatype": "STRING", "display_name": "F1"},
        {"keyname": "f2", "datatype": "STRING", "display_name": "F2"},
    ]
    value = {
        "geometry_type": "POINT",
        "fields": form_fields,
        "items": [
            {
                "type": "textbox",
                "field": "f1",
                "remember": False,
                "max_lines": 1,
            },
            {
                "type": "textbox",
                "field": "f2",
                "remember": False,
                "max_lines": 1,
            },
        ],
    }

    rapi.create(
        "formbuilder_form",
        {
            "resource": {"parent": {"id": vector_layer}},
            "formbuilder_form": {
                "value": value,
                "update_feature_layer_fields": True,
            },
        },
    )

    fields = get_fields(rapi, vector_layer)
    assert len(fields) == len(form_fields)
    for f1, f2 in zip(fields, form_fields):
        for k in ("keyname", "datatype", "display_name"):
            assert f1[k] == f2[k]
