import { useCallback, useEffect, useMemo, useState } from "react";

import type { FormbuilderFormRead } from "@nextgisweb/formbuilder/type/api";
import { Form } from "@nextgisweb/gui/antd";

import { formElementRuntime } from "./element";
import type {
  FormAttributes,
  FormElementRuntime,
  FormRuntimeContext,
  FormRuntimeItem,
} from "./type";

type FormValue = NonNullable<FormbuilderFormRead["value"]>;

export interface FormRuntimeProps {
  value: FormValue;
  isNew?: boolean;
  disabled?: boolean;
  revision?: unknown;
  attributes: FormAttributes;
  rememberedValues?: Map<string, unknown>;
  onValidatorChange?: (validator: (() => Promise<boolean>) | undefined) => void;
  fieldRequired?: (keyname: string) => boolean;
  onChange: (changedValues: FormAttributes) => void;
}

interface RuntimeItemsProps {
  path?: string;
  items: FormRuntimeItem[];
  context: FormRuntimeContext;
}

const fieldNotRequired = () => false;

function RuntimeItems({ path = "root", items, context }: RuntimeItemsProps) {
  return items.map((item, index) => {
    const itemPath = `${path}-${index}`;
    const runtime = formElementRuntime[item.type] as FormElementRuntime;
    return <div key={itemPath}>{runtime?.render(item, context, itemPath)}</div>;
  });
}

function collectInitial(
  items: FormRuntimeItem[],
  context: FormRuntimeContext
): FormAttributes {
  const result: FormAttributes = {};
  for (const item of items) {
    const runtime = formElementRuntime[item.type] as FormElementRuntime;
    const initial = runtime?.getInitial?.(item, context);
    if (initial) {
      Object.assign(result, initial);
    }
  }
  return result;
}

function collectRememberedFields(
  items: FormRuntimeItem[],
  result = new Set<string>()
): Set<string> {
  for (const item of items) {
    if (item.type === "tabs") {
      for (const tab of item.tabs) collectRememberedFields(tab.items, result);
      continue;
    }
    if (!("remember" in item) || item.remember !== true) continue;

    if (item.type === "cascade") {
      result.add(item.field_primary);
      result.add(item.field_secondary);
    } else if ("field" in item && typeof item.field === "string") {
      result.add(item.field);
    }
  }
  return result;
}

export function FormRuntime({
  value,
  isNew = false,
  disabled = false,
  revision,
  attributes,
  rememberedValues,
  onValidatorChange,
  fieldRequired = fieldNotRequired,
  onChange,
}: FormRuntimeProps) {
  const [form] = Form.useForm();

  const formFields = useMemo(
    () => new Map(value.fields.map((field) => [field.keyname, field])),
    [value.fields]
  );
  const rememberedFields = useMemo(
    () => collectRememberedFields(value.items),
    [value.items]
  );
  const handleChange = useCallback(
    (changedValues: FormAttributes) => {
      if (isNew && rememberedValues) {
        for (const [keyname, fieldValue] of Object.entries(changedValues)) {
          if (rememberedFields.has(keyname)) {
            rememberedValues.set(keyname, fieldValue);
          }
        }
      }
      onChange(changedValues);
    },
    [isNew, onChange, rememberedFields, rememberedValues]
  );
  const context = useMemo<FormRuntimeContext>(() => {
    const nextContext: FormRuntimeContext = {
      form,
      collectInitial: (items) => collectInitial(items, nextContext),
      fieldDatatype: (keyname) => formFields.get(keyname)?.datatype,
      fieldRequired,
      setFieldValue: (keyname, fieldValue) => {
        form.setFieldValue(keyname, fieldValue);
        handleChange({ [keyname]: fieldValue });
      },
      renderItems: (items, path) => (
        <RuntimeItems items={items} context={nextContext} path={path} />
      ),
      disabled,
    };
    return nextContext;
  }, [disabled, fieldRequired, form, formFields, handleChange]);

  const [initial] = useState(() => {
    const defaults: FormAttributes = isNew
      ? context.collectInitial(value.items)
      : {};
    if (isNew && rememberedValues) {
      for (const keyname of rememberedFields) {
        if (rememberedValues.has(keyname)) {
          defaults[keyname] = rememberedValues.get(keyname);
        }
      }
    }
    for (const keyname in defaults) {
      if (attributes[keyname] !== null && attributes[keyname] !== undefined) {
        delete defaults[keyname];
      }
    }
    return { defaults, values: { ...attributes, ...defaults }, onChange };
  });

  useEffect(() => {
    form.setFieldsValue(attributes);
  }, [attributes, form, revision]);

  useEffect(() => {
    if (Object.keys(initial.defaults).length) {
      form.setFieldsValue(initial.defaults);
      initial.onChange(initial.defaults);
    }
  }, [form, initial]);

  useEffect(() => {
    const validate = async () => {
      try {
        await form.validateFields();
        return true;
      } catch {
        return false;
      }
    };
    onValidatorChange?.(validate);
    return () => onValidatorChange?.(undefined);
  }, [form, onValidatorChange]);

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initial.values}
      disabled={disabled}
      onValuesChange={handleChange}
    >
      <RuntimeItems items={value.items} context={context} />
    </Form>
  );
}
