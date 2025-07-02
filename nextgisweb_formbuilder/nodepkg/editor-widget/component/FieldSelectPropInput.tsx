import { Select } from "antd";
import type { SelectProps } from "antd";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import type React from "react";

import type { FormbuilderEditorStore } from "../FormbuilderEditorStore";

import { AddFieldModalButton } from "./AddFieldModalButton";
import type { SerializedFieldFromSchema } from "./PropertiesPanel";

interface FieldSelectProps {
    prop: SerializedFieldFromSchema;
    fieldOptions: SelectProps["options"];
    store: FormbuilderEditorStore;
    updateFieldInSelectedInput: (
        newFieldKeyname: string,
        propName: string
    ) => void;
    value?: string;
    onChange?: (value: string) => void;
}

export const FieldSelectInput: React.FC<FieldSelectProps> = observer(
    ({
        prop,
        fieldOptions = [],
        store,
        updateFieldInSelectedInput,
        value,
        onChange,
    }) => {
        const [open, setOpen] = useState(false);

        const mappedOptions =
            fieldOptions?.map((option) => {
                const fullFieldData = store.fields.find(
                    (field) => field.keyname === option.value
                );

                const disabledDatatypeChecked =
                    option.disabled ||
                    !(prop?.datatypes || []).includes(
                        fullFieldData?.datatype || ""
                    );

                return {
                    ...option,
                    label: (
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                width: "100%",
                            }}
                        >
                            <span>{option.label}</span>
                            <span
                                style={{
                                    color: "gray",
                                    fontSize: "10px",
                                }}
                            >
                                {fullFieldData?.datatype}
                            </span>
                        </div>
                    ),
                    disabled: disabledDatatypeChecked,
                };
            }) || [];

        return (
            <Select
                open={open}
                onOpenChange={setOpen}
                value={value}
                onChange={onChange}
                options={mappedOptions}
                popupRender={(origin) => (
                    <>
                        {origin}
                        <div
                            style={{ marginBlockStart: "4px" }}
                            onClick={() => setOpen(false)}
                        >
                            <AddFieldModalButton
                                store={store}
                                fieldPropKeyname={prop.keyname}
                                updateSelectedInputCallback={
                                    updateFieldInSelectedInput
                                }
                            />
                        </div>
                    </>
                )}
            />
        );
    }
);

FieldSelectInput.displayName = "FieldSelectInput";
