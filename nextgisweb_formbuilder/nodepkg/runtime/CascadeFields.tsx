import { Form, Select } from "@nextgisweb/gui/antd";

import type { FormRuntimeContext, FormRuntimeItem } from "./type";
import { fieldRules } from "./util";

interface CascadeFieldsProps {
  item: FormRuntimeItem<"cascade">;
  context: FormRuntimeContext;
}

export function CascadeFields({ item, context }: CascadeFieldsProps) {
  const primary = Form.useWatch(item.field_primary, context.form);
  const secondaryOptions =
    item.options.find((option) => option.value === primary)?.items ?? [];

  return (
    <>
      <Form.Item
        name={item.field_primary}
        rules={fieldRules(item.field_primary, context)}
      >
        <Select
          disabled={context.disabled}
          options={item.options}
          onChange={() => context.setFieldValue(item.field_secondary, null)}
        />
      </Form.Item>
      <Form.Item
        name={item.field_secondary}
        rules={fieldRules(item.field_secondary, context)}
      >
        <Select
          disabled={
            context.disabled || primary === null || primary === undefined
          }
          options={secondaryOptions}
        />
      </Form.Item>
    </>
  );
}
