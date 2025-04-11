import type { FormbuilderEditorField } from "../FormbuilderEditorStore";

export const getNewFieldKeyname = (fields: FormbuilderEditorField[]) => {
    let counter = 1;
    let newFieldKeyname = `field_${fields.length + 1}`;

    const getNewFieldKeynameInner = (
        fields: FormbuilderEditorField[]
    ): string => {
        if (!fields.find((field) => field.keyname === newFieldKeyname)) {
            return newFieldKeyname;
        } else {
            newFieldKeyname = `field_${fields.length + counter}`;
            counter += 1;
            return getNewFieldKeynameInner(fields);
        }
    };

    return getNewFieldKeynameInner(fields);
};
