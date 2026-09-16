import {
  Input,
  InputBigInteger,
  InputInteger,
  InputNumber,
} from "@nextgisweb/gui/antd";

import { INPUT_STYLE } from "../constant";

import type { FormRuntimeContext } from "./type";

export function FieldInput({
  keyname,
  context,
  placeholder,
  maxLines,
  value,
  onChange,
  id,
}: {
  keyname: string;
  context: FormRuntimeContext;
  placeholder?: string;
  maxLines?: number;
  value?: string | number | null;
  onChange?: (value: unknown) => void;
  id?: string;
}) {
  const common = {
    id,
    onChange,
    disabled: context.disabled,
    placeholder,
    style: INPUT_STYLE,
  };

  switch (context.fieldDatatype(keyname)) {
    case "STRING":
      return maxLines && maxLines > 1 ? (
        <Input.TextArea
          {...common}
          value={value ?? ""}
          autoSize={{
            minRows: 2,
            maxRows: maxLines,
          }}
        />
      ) : (
        <Input {...common} value={value ?? ""} />
      );

    case "INTEGER":
      return (
        <InputInteger
          {...common}
          value={value === null ? null : Number(value)}
        />
      );

    case "BIGINT":
      return (
        <InputBigInteger
          {...common}
          value={value === null ? null : String(value)}
        />
      );

    case "REAL":
      return (
        <InputNumber
          {...common}
          value={value === null ? null : Number(value)}
        />
      );

    default:
      return <Input {...common} value={value ?? ""} />;
  }
}
