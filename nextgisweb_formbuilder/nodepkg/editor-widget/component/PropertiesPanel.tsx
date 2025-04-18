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
import { elementsData } from "../element";
import { isFieldOccupied } from "../util/fieldRelatedOperations";

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
            const currentInputField = form.getFieldValue("field");
            if (
                !store.fields.find(
                    (field) => field.keyname === currentInputField
                )
            ) {
                const currentSelectedInput = store.selectedInput;
                if (currentSelectedInput) {
                    const updatedSelectedInput = {
                        id: currentSelectedInput?.id,
                        value: currentSelectedInput?.value,
                        data: { ...currentSelectedInput?.data, field: "-" },
                    };
                    store.setSelectedInput(updatedSelectedInput);
                }
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

        const fieldsFromScheme = Object.entries(currentInputSchema).map(
            ([key, value]) => ({
                keyname: key,
                label: value.formLabel,
                type: value.type,
            })
        );

        const onFormChange = () => {
            if (store.selectedInput && store.selectedInput?.id) {
                store.setNewElementData(store.selectedInput.id, {
                    ...form.getFieldsValue(),
                });

                if (store.setDirty) store.setDirty(true);
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
                            {fieldsFromScheme.map(
                                ({ keyname, type, label }, i) => (
                                    <Form.Item
                                        style={{ marginBottom: "6px" }}
                                        key={i}
                                        label={label}
                                        name={keyname}
                                        valuePropName={
                                            type === "boolean"
                                                ? "checked"
                                                : "value"
                                        }
                                    >
                                        {keyname === "field" ? (
                                            <Select
                                                value={form.getFieldValue(
                                                    "field"
                                                )}
                                                options={fieldOptions}
                                            />
                                        ) : (
                                            getPropertiesFormInput(
                                                type as string
                                            )
                                        )}
                                    </Form.Item>
                                )
                            )}
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
