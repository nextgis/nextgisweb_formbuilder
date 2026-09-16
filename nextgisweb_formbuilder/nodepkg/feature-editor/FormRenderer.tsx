import { observer } from "mobx-react-lite";
import { useCallback } from "react";

import type AttributeEditorStore from "@nextgisweb/feature-layer/attribute-editor/AttributeEditorStore";
import type { AppAttributes } from "@nextgisweb/feature-layer/attribute-editor/type";
import type { FormbuilderFormRead } from "@nextgisweb/formbuilder/type/api";
import { LoadingWrapper } from "@nextgisweb/gui/component";

import { FormRuntime } from "../runtime";

import { FeatureEditorContext } from "./context/useFeatureEditorContext";

type FormValue = NonNullable<FormbuilderFormRead["value"]>;

interface FormRendererProps {
  store: AttributeEditorStore;
  value: FormValue;
  rememberedValues: Map<string, unknown>;
}

export const FormRenderer = observer(
  ({ store, value, rememberedValues }: FormRendererProps) => {
    const fieldRequired = useCallback(
      (keyname: string) =>
        store.fields.find((field) => field.keyname === keyname)?.required ===
        true,
      [store]
    );
    const onChange = useCallback(
      (changedValues: Record<string, unknown>) =>
        store.setValues(changedValues as AppAttributes),
      [store]
    );

    if (!store.isReady) return <LoadingWrapper />;

    return (
      <FeatureEditorContext value={store._parentStore}>
        <FormRuntime
          value={value}
          isNew={
            store._parentStore !== undefined &&
            typeof store._parentStore.featureId !== "number"
          }
          disabled={store.saving}
          revision={store.loadRevision}
          attributes={store.attributes}
          rememberedValues={rememberedValues}
          onValidatorChange={store.setValidator}
          fieldRequired={fieldRequired}
          onChange={onChange}
        />
      </FeatureEditorContext>
    );
  }
);

FormRenderer.displayName = "FormRenderer";
