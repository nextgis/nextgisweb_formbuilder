import { observer } from "mobx-react-lite";
import { MultiPoint, Point } from "ol/geom";
import { get as getProjection, transform } from "ol/proj";
import { use, useEffect, useMemo } from "react";

import { Form, InputNumber, Space } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";

import { INPUT_STYLE } from "../constant";
import { FeatureEditorContext } from "../feature-editor/context/useFeatureEditorContext";

import type { FormRuntimeContext, FormRuntimeItem } from "./type";
import { fieldRules } from "./util";

export const CoordinatesFields = observer(function CoordinatesFields({
  item,
  context,
}: {
  item: FormRuntimeItem<"coordinates">;
  context: FormRuntimeContext;
}) {
  const store = use(FeatureEditorContext);
  const geometry = store?.geometry;
  const geometryType = store?.featureLayer?.geometry_type;
  const srsId = store?.featureLayer?.srs?.id;

  const coordinates = useMemo(() => {
    if (geometryType && !geometryType.includes("POINT")) return null;
    if (!geometry) return undefined;

    try {
      if (
        geometry instanceof MultiPoint &&
        geometry.getCoordinates().length !== 1
      ) {
        return null;
      }

      const point =
        geometry instanceof MultiPoint
          ? geometry.getCoordinates()[0]
          : geometry instanceof Point
            ? geometry.getCoordinates()
            : null;

      if (!point) return null;

      const projection = getProjection(`EPSG:${srsId}`);
      if (!projection) return undefined;

      const result = transform(point, projection, "EPSG:4326");

      if (!result.every(Number.isFinite)) return undefined;

      return [Number(result[0].toFixed(6)), Number(result[1].toFixed(6))];
    } catch {
      return undefined;
    }
  }, [geometry, geometryType, srsId]);

  const watch = {
    form: context.form,
    preserve: true,
  };

  const longitude = Form.useWatch(item.field_lon, watch);
  const latitude = Form.useWatch(item.field_lat, watch);

  useEffect(() => {
    if (!coordinates) return;

    [item.field_lon, item.field_lat].forEach((keyname, index) => {
      if (context.form.getFieldValue(keyname) !== coordinates[index]) {
        context.setFieldValue(keyname, coordinates[index]);
      }
    });
  }, [
    context,
    coordinates,
    item.field_lon,
    item.field_lat,
    longitude,
    latitude,
  ]);

  if (item.hidden || coordinates === null) return null;

  return (
    <Form.Item>
      <div
        style={{
          display: "flex",
          width: "100%",
          gap: "1em",
        }}
      >
        {[item.field_lon, item.field_lat].map((keyname, index) => (
          <div
            key={keyname}
            style={{
              display: "flex",
              alignItems: "center",
              flex: 1,
              minWidth: 0,
              gap: "0.5em",
            }}
          >
            <span style={{ whiteSpace: "nowrap" }}>
              {index === 0 ? gettext("Longitude") : gettext("Latitude")}
            </span>

            <Space.Compact
              style={{
                flex: 1,
                minWidth: 0,
              }}
            >
              <Form.Item
                name={keyname}
                rules={fieldRules(keyname, context)}
                noStyle
              >
                <InputNumber
                  style={INPUT_STYLE}
                  precision={6}
                  disabled={context.disabled}
                  readOnly={coordinates !== undefined}
                />
              </Form.Item>

              <Space.Addon>°</Space.Addon>
            </Space.Compact>
          </div>
        ))}
      </div>
    </Form.Item>
  );
});
