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
