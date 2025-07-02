import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";

import { Button, Form, Input, Modal, Select } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";

import type {
    FormbuilderEditorField,
    FormbuilderEditorStore,
} from "../FormbuilderEditorStore";
import { elementsData } from "../element";
import { fieldDataTypeOptions } from "../fields";
import { getNewFieldKeynamePostfix } from "../util/newFieldKeyname";
import { useFieldValidationRules } from "../util/useFieldValidationRules";

const msgAdd = gettext("Add");
const msgNewField = gettext("New field");

const msgFieldKeyname = gettext("Keyname");
const msgFieldDisplayName = gettext("Display name");
const msgFieldDataType = gettext("Data type");

type AddFieldModalButtonProps = {
    store: FormbuilderEditorStore;
    fieldPropKeyname?: string;
    updateSelectedInputCallback?: (
        fieldKeyname: string,
        fieldPropKeyname: string
    ) => void;
};

export const AddFieldModalButton = observer(
    ({
        store,
        fieldPropKeyname,
        updateSelectedInputCallback,
    }: AddFieldModalButtonProps) => {
        const [addFieldModalOpen, setAddFieldModalOpen] = useState(false);
        const [form] = Form.useForm();

        const { rulesRequired, rulesKeyname, rulesDisplayName } =
            useFieldValidationRules(store.fields);

        useEffect(() => {
            if (addFieldModalOpen) {
                const newFieldPostfix = getNewFieldKeynamePostfix([
                    ...store.fields,
                ]);

                form.setFieldsValue({
                    keyname: `field_${newFieldPostfix}`,
                    display_name: `${gettext("Field")} ${newFieldPostfix}`,
                    datatype: "STRING",
                });
            }
        }, [addFieldModalOpen, form, store.fields]);

        const fullElementData = elementsData.find(
            (el) => el.elementId === store.selectedInput?.value.type
        );

        const acceptableDataTypes = fieldPropKeyname
            ? fullElementData?.schema[fieldPropKeyname].datatypes
            : fieldDataTypeOptions.map((option) => option.value);

        // simpler interface with filtered options, not setting disabled for not acceptable datatypes
        const filteredFieldDataTypeOptions = fieldDataTypeOptions.filter(
            (option) => {
                return acceptableDataTypes?.includes(option.value);
            }
        );

        const handleOk = () => {
            form.validateFields()
                .then((result) => {
                    store.setFields([...store.fields, result]);
                    setAddFieldModalOpen(false);
                    if (updateSelectedInputCallback && fieldPropKeyname) {
                        updateSelectedInputCallback(
                            result.keyname,
                            fieldPropKeyname
                        );
                    }
                })
                .catch(() => {
                    // validation failed
                });
        };

        return (
            <>
                <Button
                    size="small"
                    style={{ marginInlineStart: "auto" }}
                    onClick={() => setAddFieldModalOpen(true)}
                >
                    {msgAdd}
                </Button>
                <Modal
                    open={addFieldModalOpen}
                    destroyOnHidden={true}
                    title={msgNewField}
                    okButtonProps={{ size: "middle" }}
                    cancelButtonProps={{ size: "middle" }}
                    closable={false}
                    onOk={handleOk}
                    onCancel={() => {
                        setAddFieldModalOpen(false);
                    }}
                >
                    <Form
                        form={form}
                        size="middle"
                        style={{ maxWidth: 600 }}
                        labelCol={{ span: 8 }}
                        wrapperCol={{ span: 16 }}
                        labelAlign="left"
                        name="AddNewFieldModal"
                        autoComplete="off"
                        requiredMark={false}
                    >
                        <Form.Item<FormbuilderEditorField>
                            style={{ marginBlock: "16px" }}
                            label={msgFieldKeyname}
                            name="keyname"
                            rules={rulesKeyname}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item<FormbuilderEditorField>
                            style={{ marginBlock: "16px" }}
                            label={msgFieldDisplayName}
                            name="display_name"
                            rules={rulesDisplayName}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item<FormbuilderEditorField>
                            style={{ marginBlock: "16px" }}
                            label={msgFieldDataType}
                            name="datatype"
                            rules={rulesRequired}
                        >
                            <Select options={filteredFieldDataTypeOptions} />
                        </Form.Item>
                    </Form>
                </Modal>
            </>
        );
    }
);

AddFieldModalButton.displayName = "AddFieldModalButton";
