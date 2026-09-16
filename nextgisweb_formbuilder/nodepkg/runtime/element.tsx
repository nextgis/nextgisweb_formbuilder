import type { Dayjs } from "dayjs";
import type { CSSProperties } from "react";

import {
  isDateTimeFieldType,
  marshalFieldValue,
  unmarshalFieldValue,
} from "@nextgisweb/feature-layer/util/ngwAttributes";
import type {
  FormbuilderDatetimeItem,
  OptionSingle,
} from "@nextgisweb/formbuilder/type/api";
import {
  AutoComplete,
  CheckboxValue,
  DatePicker,
  DateTimePicker,
  Form,
  Input,
  Radio,
  Select,
  Tabs,
  TimePicker,
} from "@nextgisweb/gui/antd";
import dayjs from "@nextgisweb/gui/dayjs";
import { gettext } from "@nextgisweb/pyramid/i18n";

import { INPUT_STYLE } from "../constant";

import { AverageInput } from "./AverageInput";
import { CascadeFields } from "./CascadeFields";
import { CoordinatesFields } from "./CoordinatesFields";
import { FieldInput } from "./FieldInput";
import type {
  FormAttributes,
  FormElementRuntime,
  FormElementType,
  FormRuntimeContext,
} from "./type";
import { fieldRules } from "./util";

type RuntimeElementDefinitions = {
  [T in FormElementType]: FormElementRuntime<T>;
};

const datetimeDatatypes = {
  date: "DATE",
  time: "TIME",
  datetime: "DATETIME",
} as const;

function checkboxValue(
  checked: boolean,
  keyname: string,
  context: FormRuntimeContext
): number | string {
  const value = Number(checked);
  return context.fieldDatatype(keyname) === "STRING" ? String(value) : value;
}

function isChecked(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

function getDatetimeDatatype(
  item: FormbuilderDatetimeItem,
  context: FormRuntimeContext
) {
  const datatype = context.fieldDatatype(item.field);
  return datatype && isDateTimeFieldType(datatype)
    ? datatype
    : datetimeDatatypes[item.datetime];
}

function getDatetimeInitial(item: FormbuilderDatetimeItem) {
  return item.initial === undefined || item.initial === "CURRENT"
    ? dayjs()
    : unmarshalFieldValue(datetimeDatatypes[item.datetime], item.initial);
}

function getOptionsInitial({
  field,
  options,
}: {
  field: string;
  options: ReadonlyArray<Pick<OptionSingle, "value" | "initial">>;
}): FormAttributes | undefined {
  const initial = options.find((option) => option.initial === true);
  return initial ? { [field]: initial.value } : undefined;
}

export const formElementRuntime: RuntimeElementDefinitions = {
  label: {
    render: (item) => <div>{item.label || <>&nbsp;</>}</div>,
  },
  spacer: {
    render: () => <div style={{ height: 16 }} />,
  },
  tabs: {
    render: (item, context, path) => {
      const activeIndex = item.tabs.findIndex(({ active }) => active);
      return (
        <Tabs
          defaultActiveKey={String(activeIndex >= 0 ? activeIndex : 0)}
          items={item.tabs.map((tab, index) => ({
            key: String(index),
            label: tab.title,
            forceRender: true,
            children: context.renderItems(tab.items, `${path}-${index}`),
          }))}
        />
      );
    },
    getInitial: (item, context) =>
      Object.assign(
        {},
        ...item.tabs.map((tab) => context.collectInitial(tab.items))
      ),
  },
  textbox: {
    render: (item, context) => (
      <Form.Item name={item.field} rules={fieldRules(item.field, context)}>
        <FieldInput
          keyname={item.field}
          context={context}
          maxLines={item.max_lines}
        />
      </Form.Item>
    ),
    getInitial: (item, context) => {
      if (item.initial === undefined) return undefined;
      const datatype = context.fieldDatatype(item.field);
      return {
        [item.field]:
          datatype === "INTEGER" || datatype === "REAL"
            ? Number(item.initial)
            : item.initial,
      };
    },
  },
  checkbox: {
    render: (item, context) => (
      <Form.Item
        name={item.field}
        rules={fieldRules(item.field, context)}
        getValueProps={(value: unknown) => ({ value: isChecked(value) })}
        getValueFromEvent={(checked: boolean) =>
          checkboxValue(checked, item.field, context)
        }
      >
        <CheckboxValue disabled={context.disabled}>{item.label}</CheckboxValue>
      </Form.Item>
    ),
    getInitial: (item, context) =>
      item.initial === undefined
        ? undefined
        : {
            [item.field]: checkboxValue(item.initial, item.field, context),
          },
  },
  datetime: {
    render: (item, context) => {
      const isString = context.fieldDatatype(item.field) === "STRING";
      const datatype = getDatetimeDatatype(item, context);
      const common = {
        disabled: context.disabled,
        style: INPUT_STYLE,
      };
      const picker =
        datatype === "DATE" ? (
          <DatePicker {...common} />
        ) : datatype === "TIME" ? (
          <TimePicker {...common} />
        ) : (
          <DateTimePicker {...common} />
        );

      return (
        <Form.Item
          name={item.field}
          rules={fieldRules(item.field, context)}
          getValueProps={(value: unknown) => ({
            value:
              value === null || value === undefined || dayjs.isDayjs(value)
                ? value
                : unmarshalFieldValue(datatype, String(value)),
          })}
          getValueFromEvent={(value: Dayjs | null) =>
            isString && value ? marshalFieldValue(datatype, value) : value
          }
        >
          {picker}
        </Form.Item>
      );
    },
    getInitial: (item, context) => {
      const value = getDatetimeInitial(item);
      const datatype = getDatetimeDatatype(item, context);

      return {
        [item.field]:
          context.fieldDatatype(item.field) === "STRING"
            ? marshalFieldValue(datatype, value)
            : value,
      };
    },
  },
  coordinates: {
    render: (item, context) => (
      <CoordinatesFields item={item} context={context} />
    ),
  },
  distance: {
    render: (item, context) => (
      <Form.Item name={item.field} rules={fieldRules(item.field, context)}>
        <FieldInput
          keyname={item.field}
          context={context}
          placeholder={gettext("Distance meter")}
        />
      </Form.Item>
    ),
  },
  average: {
    render: (item, context, path) => (
      <Form.Item name={item.field} rules={fieldRules(item.field, context)}>
        <AverageInput
          id={path}
          samples={item.samples}
          datatype={context.fieldDatatype(item.field)}
          disabled={context.disabled}
        />
      </Form.Item>
    ),
  },
  photo: {
    render: () => null,
  },
  system: {
    render: (item, context) => {
      if (item.system === "ngid_username") return null;
      return (
        <Form.Item name={item.field} rules={fieldRules(item.field, context)}>
          <Input readOnly disabled={context.disabled} />
        </Form.Item>
      );
    },
    getInitial: (item) => ({ [item.field]: ngwConfig.userDisplayName }),
  },
  dropdown: {
    render: (item, context) => (
      <Form.Item name={item.field} rules={fieldRules(item.field, context)}>
        {item.free_input ? (
          <AutoComplete
            id={`ngw-formbuilder-options-${item.field}`}
            style={INPUT_STYLE}
            options={item.options}
            disabled={context.disabled}
            allowClear
          />
        ) : (
          <Select
            options={item.options}
            disabled={context.disabled}
            allowClear
            showSearch={item.search}
          />
        )}
      </Form.Item>
    ),
    getInitial: getOptionsInitial,
  },
  dropdown_dual: {
    render: (item, context) => {
      const columns: CSSProperties = {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8,
      };
      return (
        <>
          {(item.label_first || item.label_second) && (
            <div style={{ ...columns, marginBottom: 4 }}>
              <span>{item.label_first}</span>
              <span>{item.label_second}</span>
            </div>
          )}
          <Form.Item name={item.field} rules={fieldRules(item.field, context)}>
            <Select
              allowClear
              disabled={context.disabled}
              options={item.options.map(({ value, first, second }) => ({
                value,
                label: (
                  <span style={columns}>
                    <span>{first}</span>
                    <span>{second}</span>
                  </span>
                ),
              }))}
            />
          </Form.Item>
        </>
      );
    },
    getInitial: getOptionsInitial,
  },
  radio: {
    render: (item, context) => (
      <Form.Item name={item.field} rules={fieldRules(item.field, context)}>
        <Radio.Group
          disabled={context.disabled}
          orientation="vertical"
          options={item.options.map(({ value, label }) => ({
            value,
            label: label || value,
          }))}
        />
      </Form.Item>
    ),
    getInitial: getOptionsInitial,
  },
  cascade: {
    render: (item, context) => <CascadeFields item={item} context={context} />,
    getInitial: (item) => {
      const primary = item.options.find((option) => option.initial === true);
      if (!primary) return undefined;
      const result: FormAttributes = { [item.field_primary]: primary.value };
      const secondary = primary.items.find((option) => option.initial === true);
      if (secondary) result[item.field_secondary] = secondary.value;
      return result;
    },
  },
};
