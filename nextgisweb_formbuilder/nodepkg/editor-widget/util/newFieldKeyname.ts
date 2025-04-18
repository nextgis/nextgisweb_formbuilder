import type { FormbuilderEditorField } from "../FormbuilderEditorStore";

export const getNewFieldKeynamePostfix = (fields: FormbuilderEditorField[]) => {
    let counter = 1;
    let newFieldKeynamePostfix = `${fields.length + 1}`;

    const getNewFieldKeynamePostfixInner = (
        fields: FormbuilderEditorField[]
    ): string => {
        if (
            !fields.find(
                (field) => field.keyname === `field_${newFieldKeynamePostfix}`
            )
        ) {
            return newFieldKeynamePostfix;
        } else {
            newFieldKeynamePostfix = `${fields.length + counter}`;
            counter += 1;
            return getNewFieldKeynamePostfixInner(fields);
        }
    };

    return getNewFieldKeynamePostfixInner(fields);
};
