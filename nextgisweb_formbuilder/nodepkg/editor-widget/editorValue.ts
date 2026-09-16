import type {
  FormbuilderField,
  FormbuilderFormItem,
  FormbuilderTabsItem,
} from "@nextgisweb/formbuilder/type/api";

export interface FormbuilderEditorValue {
  value?: {
    fields?: Array<FormbuilderField & { existing?: boolean }>;
    items?: Array<FormbuilderTabsItem | FormbuilderFormItem>;
  } | null;
}
