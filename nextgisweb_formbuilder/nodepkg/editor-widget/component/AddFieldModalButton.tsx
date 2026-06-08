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
import { labelsClassName } from "../form-util";
import { getNewFieldKeynamePostfix } from "../util/newFieldKeyname";
import { useFieldValidationRules } from "../util/useFieldValidationRules";

const msgAdd = gettext("Add");
const msgNewField = gettext("New field");
const msgFieldDisplayName = gettext("Display name");
const msgFieldKeyname = gettext("Keyname");
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
        const newFieldPostfix = getNewFieldKeynamePostfix([...store.fields]);

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
      form
        .validateFields()
        .then((result) => {
          store.setFields([...store.fields, result]);
          setAddFieldModalOpen(false);
          if (updateSelectedInputCallback && fieldPropKeyname) {
            updateSelectedInputCallback(result.keyname, fieldPropKeyname);
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
            className={labelsClassName}
            style={{ maxWidth: 600 }}
            size="middle"
            labelAlign="left"
            form={form}
            name="AddNewFieldModal"
            autoComplete="off"
            requiredMark={false}
          >
            <Form.Item<FormbuilderEditorField>
              name="display_name"
              label={msgFieldDisplayName}
              rules={rulesDisplayName}
            >
              <Input />
            </Form.Item>

            <Form.Item<FormbuilderEditorField>
              name="datatype"
              label={msgFieldDataType}
              rules={rulesRequired}
            >
              <Select options={filteredFieldDataTypeOptions} />
            </Form.Item>

            <Form.Item<FormbuilderEditorField>
              name="keyname"
              label={msgFieldKeyname}
              rules={rulesKeyname}
            >
              <Input />
            </Form.Item>
          </Form>
        </Modal>
      </>
    );
  }
);

AddFieldModalButton.displayName = "AddFieldModalButton";
