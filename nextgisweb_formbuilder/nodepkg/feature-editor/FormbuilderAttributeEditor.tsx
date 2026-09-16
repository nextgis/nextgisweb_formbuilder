import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";

import type AttributeEditorStore from "@nextgisweb/feature-layer/attribute-editor/AttributeEditorStore";
import type { FormbuilderFormRead } from "@nextgisweb/formbuilder/type/api";
import { LoadingWrapper } from "@nextgisweb/gui/component";
import { errorModal } from "@nextgisweb/gui/error";
import { route } from "@nextgisweb/pyramid/api";

import "./FormbuilderAttributeEditor.less";
import { FormRenderer } from "./FormRenderer";

type FormValue = NonNullable<FormbuilderFormRead["value"]>;

interface FormbuilderAttributeEditorProps {
  formId: number;
  store: AttributeEditorStore;
}

const formValuesByStore = new WeakMap<
  AttributeEditorStore,
  Map<number, FormValue>
>();
const rememberedValuesByForm = new Map<number, Map<string, unknown>>();

function getFormValues(store: AttributeEditorStore): Map<number, FormValue> {
  let values = formValuesByStore.get(store);
  if (!values) {
    values = new Map();
    formValuesByStore.set(store, values);
  }
  return values;
}

function getRememberedValues(formId: number): Map<string, unknown> {
  let values = rememberedValuesByForm.get(formId);
  if (!values) {
    values = new Map();
    rememberedValuesByForm.set(formId, values);
  }
  return values;
}

const FormbuilderAttributeEditor = observer(
  ({ formId, store }: FormbuilderAttributeEditorProps) => {
    const formValues = getFormValues(store);
    const [formValue, setFormValue] = useState<FormValue | null>(
      () => formValues.get(formId) ?? null
    );
    const [loading, setLoading] = useState(() => !formValues.has(formId));

    useEffect(() => {
      const cached = formValues.get(formId);
      if (cached) {
        setFormValue(cached);
        setLoading(false);
        return;
      }

      let cancelled = false;
      setLoading(true);

      route("formbuilder.formbuilder_form_convert")
        .post({ json: { resource: { id: formId } } })
        .then((value) => {
          formValues.set(formId, value);
          if (!cancelled) setFormValue(value);
        })
        .catch((error: unknown) => {
          if (!cancelled) errorModal(error);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }, [formId, formValues]);

    if (loading) return <LoadingWrapper />;
    if (!formValue) return null;

    return (
      <div className="ngw-formbuilder-feature-editor">
        <FormRenderer
          store={store}
          value={formValue}
          rememberedValues={getRememberedValues(formId)}
        />
      </div>
    );
  }
);

FormbuilderAttributeEditor.displayName = "FormbuilderAttributeEditor";

export default FormbuilderAttributeEditor;
