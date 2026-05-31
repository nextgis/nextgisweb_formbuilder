import type { ReactNode } from "react";

import type { FeatureLayerFieldDatatype } from "@nextgisweb/feature-layer/type/api";
import { useThemeVariables } from "@nextgisweb/gui/hook";

import "./FieldLabel.less";

export interface FieldLabelProps {
  label: ReactNode;
  datatype?: FeatureLayerFieldDatatype;
}

export function FieldLabel({ label, datatype }: FieldLabelProps) {
  const themeVariables = useThemeVariables({
    "theme-padding-sm": "paddingSM",
    "theme-color-text-quaternary": "colorTextQuaternary",
    "theme-font-size-sm": "fontSizeSM",
  });
  return (
    <div className="ngw-formbuilder-field-label" style={themeVariables}>
      <span className="label">{label}</span>
      {datatype && <span className="datatype">{datatype}</span>}
    </div>
  );
}
