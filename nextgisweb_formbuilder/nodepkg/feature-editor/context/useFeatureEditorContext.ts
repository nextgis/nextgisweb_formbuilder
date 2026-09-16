import { createContext } from "react";

import type { FeatureEditorStore } from "@nextgisweb/feature-layer/feature-editor/FeatureEditorStore";
import type { MapStore } from "@nextgisweb/webmap/ol/MapStore";

export interface MapContextValue {
  mapStore: MapStore;
}

export const FeatureEditorContext = createContext<
  FeatureEditorStore | undefined
>(undefined);

FeatureEditorContext.displayName = "FeatureEditorContext";
