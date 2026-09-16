import type { ReactNode } from "react";

import type { FormbuilderFormRead } from "@nextgisweb/formbuilder/type/api";
import type { FormInstance } from "@nextgisweb/gui/antd";

type FormValue = NonNullable<FormbuilderFormRead["value"]>;
export type FormElementType = FormValue["items"][number]["type"];
export type FormRuntimeItem<T extends FormElementType = FormElementType> =
  Extract<FormValue["items"][number], { type: T }>;
export type FormRuntimeField = FormValue["fields"][number];
export type FormAttributes = Record<string, unknown>;

export interface FormRuntimeContext {
  form: FormInstance;
  disabled: boolean;
  fieldDatatype: (keyname: string) => FormRuntimeField["datatype"] | undefined;
  fieldRequired: (keyname: string) => boolean;
  setFieldValue: (keyname: string, value: unknown) => void;
  renderItems: (items: FormRuntimeItem[], path: string) => ReactNode;
  collectInitial: (items: FormRuntimeItem[]) => FormAttributes;
}

export interface FormElementRuntime<
  T extends FormElementType = FormElementType,
> {
  render: (
    item: FormRuntimeItem<T>,
    context: FormRuntimeContext,
    path: string
  ) => ReactNode;
  getInitial?: (
    item: FormRuntimeItem<T>,
    context: FormRuntimeContext
  ) => FormAttributes | undefined;
}
