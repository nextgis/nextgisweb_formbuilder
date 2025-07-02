import type { FormRule } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";

import type { FormbuilderEditorField } from "../FormbuilderEditorStore";

const msgFieldRequiredMessage = gettext("Mandatory field");
const msgFieldKeyNotUnique = gettext("Key must be unique");
const msgFieldDisplayNameNotUnique = gettext("Display name must be unique");

export function useFieldValidationRules(fields: FormbuilderEditorField[]) {
    const isFieldKeyNotUnique = (keyname: string) =>
        fields.find((field) => field.keyname === keyname);

    const isFieldDisplayNameNotUnique = (display_name: string) =>
        fields.find((field) => field.display_name === display_name);

    const rulesRequired: FormRule[] = [
        {
            required: true,
            message: msgFieldRequiredMessage,
        },
    ];

    const rulesKeyname: FormRule[] = [
        ...rulesRequired,
        {
            validator: (_, value) => {
                const isNotUnique = isFieldKeyNotUnique(value);
                return isNotUnique
                    ? Promise.reject(new Error(msgFieldKeyNotUnique))
                    : Promise.resolve();
            },
        },
    ];

    const rulesDisplayName: FormRule[] = [
        ...rulesRequired,
        {
            validator: (_, value) => {
                const isNotUnique = isFieldDisplayNameNotUnique(value);
                return isNotUnique
                    ? Promise.reject(new Error(msgFieldDisplayNameNotUnique))
                    : Promise.resolve();
            },
        },
    ];

    return {
        rulesRequired,
        rulesKeyname,
        rulesDisplayName,
    };
}
