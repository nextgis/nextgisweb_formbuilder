import { gettext } from "@nextgisweb/pyramid/i18n";

import type { FormRuntimeContext } from "./type";

const msgRequired = gettext("This field is required");

export function fieldRules(keyname: string, context: FormRuntimeContext) {
  return context.fieldRequired(keyname)
    ? [{ required: true, message: msgRequired }]
    : undefined;
}
