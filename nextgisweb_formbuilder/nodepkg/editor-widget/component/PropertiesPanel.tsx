import { observer } from "mobx-react-lite";
import { useEffect, useMemo } from "react";

import type { FormbuilderDatetimeItem } from "@nextgisweb/formbuilder/type/api";
import {
    Checkbox,
    DatePicker,
    DateTimePicker,
    Form,
    Input,
    InputNumber,
    Select,
    TimePicker,
} from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";

import type { FormbuilderEditorStore } from "../FormbuilderEditorStore";
import { allFieldProps, elementsData } from "../element";
import type { SchemaEntry } from "../element";
import type { UIListItem } from "../type";
import { isFieldOccupied } from "../util/fieldRelatedOperations";

import { CascadeOptionsInput } from "./CascadeOptionsInput";
import { FieldSelectInput } from "./FieldSelectPropInput";
import { OptionsInput } from "./OptionsInput";
import { TabsCustomModifier } from "./TabsCustomModifier";

const msgPropertiesHeader = gettext("Properties");

export type SerializedFieldFromSchema = SchemaEntry & {
    keyname: string;
    formLabel: string;
};

export const PropertiesPanel = observer(
    ({ store }: { store: FormbuilderEditorStore }) => {
        const currentInputType = store.selectedInput?.value?.type || "textbox";

        const [form] = Form.useForm();

        useEffect(() => {
            if (store.selectedInput) {
                form.setFieldsValue(store.selectedInput?.data);
            }
        }, [form, store.selectedInput]);

        useEffect(() => {
            const selectedInputProps = Object.keys(store.selectedInput?.data);

            const fieldPropsToCleanIfFieldDeleted = allFieldProps.filter(
                (prop: string) => selectedInputProps.includes(prop)
            );
            const fieldPropsPartDataEntries: [string, string][] = [];

            fieldPropsToCleanIfFieldDeleted.forEach((propName: string) => {
                const fieldVal = form.getFieldValue(propName);

                if (!store.fields.find(({ keyname }) => keyname === fieldVal)) {
                    fieldPropsPartDataEntries.push([propName, "-"]);
                }
            });

            const fieldsPartData = Object.fromEntries(
                fieldPropsPartDataEntries
            );

            const currentSelectedInput = store.selectedInput;
            if (currentSelectedInput) {
                const updatedSelectedInput = {
                    id: currentSelectedInput?.id,
                    value: currentSelectedInput?.value,
                    data: { ...currentSelectedInput?.data, ...fieldsPartData },
                };
                store.setSelectedInput(updatedSelectedInput);
            }
        }, [form, store, store.fields]);

        const isFieldDisabled = (keyname: string) => {
            // probably using data.field is wrong here, maybe other names
            if (keyname === store.selectedInput?.data?.field) {
                return false;
            } else {
                return isFieldOccupied(keyname as string, store.inputsTree);
            }
        };

        const fieldOptions = [
            ...store.fields.map((field) => ({
                value: field.keyname as string,
                label: field.display_name,
                disabled: isFieldDisabled(field.keyname as string),
            })),
        ];

        const currentInputSchema =
            elementsData.find((el) => el.elementId === currentInputType)
                ?.schema || {};

        const fieldsFromSchema: SerializedFieldFromSchema[] = Object.entries(
            currentInputSchema
        ).map(([key, value]) => ({
            keyname: key,
            label: value.formLabel,
            ...value,
        }));

        const onFormChange = () => {
            if (store.selectedInput && store.selectedInput?.id) {
                store.setNewElementData(store.selectedInput.id, {
                    ...form.getFieldsValue(),
                });

                store.setSelectedInput({
                    ...store.selectedInput,
                    data: { ...form.getFieldsValue() },
                });

                if (store.setDirty) store.setDirty(true);
            }
        };

        const timeSelectMapping = useMemo(
            () => ({
                date: (
                    <DatePicker
                        style={{ width: "100%" }}
                        placeholder={gettext("Current date")}
                    />
                ),
                time: (
                    <TimePicker
                        style={{ width: "100%" }}
                        placeholder={gettext("Current time")}
                    />
                ),
                datetime: (
                    <DateTimePicker
                        style={{ width: "100%" }}
                        placeholder={gettext("Current date & time")}
                    />
                ),
            }),
            []
        );

        const updateFieldInSelectedInput = (
            newFieldKeyname: string,
            propName: string
        ) => {
            const currentSelectedInput = store.selectedInput;

            if (currentSelectedInput && currentSelectedInput.id) {
                const updatedSelectedInput = {
                    id: currentSelectedInput?.id,
                    value: currentSelectedInput?.value,
                    data: {
                        ...currentSelectedInput?.data,
                        [propName]: newFieldKeyname,
                    },
                };

                store.setSelectedInput(updatedSelectedInput);
                form.validateFields().then((result) => {
                    store.setNewElementData(
                        currentSelectedInput.id as number,
                        result
                    );
                });
            }
        };

        const getPropertiesFormInput = (
            prop: SerializedFieldFromSchema,
            input?: UIListItem
        ) => {
            const { min, max, selectOptions } = prop;

            const datetimeType = input?.data?.datetime || "datetime";
            switch (prop.type) {
                case "string":
                    return <Input />;
                case "field":
                    return (
                        <FieldSelectInput
                            store={store}
                            prop={prop}
                            fieldOptions={fieldOptions}
                            updateFieldInSelectedInput={
                                updateFieldInSelectedInput
                            }
                        />
                    );
                case "boolean":
                    return <Checkbox />;
                case "number":
                    return <InputNumber min={min} max={max} />;
                case "select":
                    return <Select options={selectOptions} />;
                case "datetime":
                    return timeSelectMapping[
                        datetimeType as FormbuilderDatetimeItem["datetime"]
                    ];
                case "options":
                    return <OptionsInput columns={prop.optionsColumns} />;
                case "cascade_options":
                    return (
                        <CascadeOptionsInput
                            columns={prop.optionsColumns}
                            depColumns={prop.dependentOptionsCoulmns}
                        />
                    );
                default:
                    return <Input />;
            }
        };

        return (
            <div className="ngw-formbuilder-editor-widget-panel ngw-formbuilder-editor-widget-panel-properties">
                <div className="panel-header">{msgPropertiesHeader}</div>
                <div className="panel-body">
                    {store.selectedInput && (
                        <>
                            <Form
                                size="small"
                                style={{ padding: "8px" }}
                                layout="horizontal"
                                labelAlign="left"
                                labelCol={{ flex: "160px" }}
                                labelWrap={true}
                                autoComplete="off"
                                name="basic"
                                form={form}
                                onFieldsChange={onFormChange}
                            >
                                {fieldsFromSchema.map((field, i) => (
                                    <Form.Item
                                        style={{ marginBottom: "6px" }}
                                        key={i}
                                        label={field.formLabel}
                                        name={field.keyname}
                                        valuePropName={
                                            field.type === "boolean"
                                                ? "checked"
                                                : "value"
                                        }
                                    >
                                        {store.selectedInput &&
                                            getPropertiesFormInput(
                                                field,
                                                store.selectedInput
                                            )}
                                    </Form.Item>
                                ))}
                            </Form>
                            <div>
                                {store.selectedInput?.value?.type === "tabs" &&
                                store.selectedInput ? (
                                    <TabsCustomModifier store={store} />
                                ) : null}
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }
);

PropertiesPanel.displayName = "PropertiesPanel";
