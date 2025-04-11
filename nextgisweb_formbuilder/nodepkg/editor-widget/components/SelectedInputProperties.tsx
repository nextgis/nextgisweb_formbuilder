import { observer } from "mobx-react-lite";
import { useEffect } from "react";

import {
    Checkbox,
    Form,
    Input,
    InputNumber,
    Select,
} from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";

import type { FormbuilderEditorStore } from "../FormbuilderEditorStore";
import { inputsSchema } from "../elements_data";
import { isFieldOccupied } from "../util/serializeData";

import { TabsCustomModifier } from "./TabsCustomModifier";

const msgPropertiesHeader = gettext("Properties");

export const SelectedInputProperties = observer(
    ({ store }: { store: FormbuilderEditorStore }) => {
        const currentInputType = store.selectedInput?.value?.type || "textbox";

        const [form] = Form.useForm();

        useEffect(() => {
            if (store.selectedInput) {
                form.setFieldsValue(store.selectedInput?.data);
            }
        }, [form, store.selectedInput]);

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
            inputsSchema[currentInputType as keyof typeof inputsSchema] || {};

        const fieldsFromScheme = Object.entries(currentInputSchema);

        const onFormChange = () => {
            if (store.selectedInput && store.selectedInput?.id) {
                store.setNewElementData(store.selectedInput.id, {
                    ...form.getFieldsValue(),
                });
            }
        };

        const getPropertiesFormInput = (type: string) => {
            switch (type) {
                case "string":
                    return <Input />;
                case "boolean":
                    return <Checkbox />;
                case "number":
                    return <InputNumber />;
                default:
                    return <Input />;
            }
        };

        return (
            <div>
                <div className="panel-header">{msgPropertiesHeader}</div>
                {store.selectedInput && (
                    <>
                        <Form
                            style={{
                                padding: "4px",
                            }}
                            form={form}
                            name="basic"
                            size="small"
                            onFieldsChange={onFormChange}
                            autoComplete="off"
                            labelCol={{ flex: "130px" }}
                            labelAlign="left"
                            labelWrap
                            layout="horizontal"
                        >
                            {fieldsFromScheme.map(([name, type], i) => (
                                <Form.Item
                                    style={{ marginBottom: "6px" }}
                                    key={i}
                                    label={name}
                                    name={name}
                                    valuePropName={
                                        type === "boolean" ? "checked" : "value"
                                    }
                                >
                                    {name === "field" ? (
                                        <Select
                                            value={form.getFieldValue("field")}
                                            options={fieldOptions}
                                            onChange={(val) => {
                                                form.setFieldValue(
                                                    "field",
                                                    val
                                                );
                                            }}
                                        />
                                    ) : (
                                        getPropertiesFormInput(type as string)
                                    )}
                                </Form.Item>
                            ))}
                        </Form>
                        <div>
                            {currentInputType === "tabs" &&
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

SelectedInputProperties.displayName = "SelectedInputProperties";
