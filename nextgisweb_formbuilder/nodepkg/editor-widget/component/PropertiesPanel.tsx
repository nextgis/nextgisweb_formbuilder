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
import { isFieldOccupied } from "../util/fieldRelatedOperations";

import { CascadeOptionsInput } from "./CascadeOptionsInput";
import { OptionsInput } from "./OptionsInput";
import { TabsCustomModifier } from "./TabsCustomModifier";

const msgPropertiesHeader = gettext("Properties");

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
            if (keyname === store.selectedInput?.data?.field) {
                return false;
            } else {
                return isFieldOccupied(keyname as string, store.inputsTree);
            }
        };

        const fieldOptions = [
            { value: "-", label: "-" },
            ...store.fields.map((field) => ({
                value: field.keyname as string,
                label: field.display_name,
                disabled: isFieldDisabled(field.keyname as string),
            })),
        ];

        const currentInputSchema =
            elementsData.find((el) => el.elementId === currentInputType)
                ?.schema || {};

        // MAKE TYPES FOR THIS
        const fieldsFromScheme = Object.entries(currentInputSchema).map(
            ([key, value]) => ({
                keyname: key,
                label: value.formLabel,
                type: value.type,
                ...value,
            })
        );

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

        // MAKE TYPES FOR THIS
        const getPropertiesFormInput = (field: any, input?: any) => {
            const { min, max, selectOptions } = field;
            const datetimeType = input?.data?.datetime || "datetime";

            switch (field.type) {
                case "string":
                    return <Input />;
                case "field":
                    return <Select options={fieldOptions} />;
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
                    return <OptionsInput columns={field.optionsColumns} />;
                case "cascade_options":
                    return (
                        <CascadeOptionsInput
                            columns={field.optionsColumns}
                            depColumns={field.dependentOptionsCoulmns}
                        />
                    );
                default:
                    return <Input />;
            }
        };

        return (
            <div className="ngw-formbuilder-editor-widget-properties-panel">
                <div className="panel-header">{msgPropertiesHeader}</div>
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
                            {fieldsFromScheme.map((field, i) => (
                                <Form.Item
                                    style={{ marginBottom: "6px" }}
                                    key={i}
                                    label={field.label}
                                    name={field.keyname}
                                    valuePropName={
                                        field.type === "boolean"
                                            ? "checked"
                                            : "value"
                                    }
                                >
                                    {getPropertiesFormInput(
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
        );
    }
);

PropertiesPanel.displayName = "PropertiesPanel";
