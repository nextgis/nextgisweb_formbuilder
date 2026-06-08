import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import {
  Button,
  Form,
  Input,
  Popover,
  Select,
  Space,
  useToken,
} from "@nextgisweb/gui/antd";
import type { FormProps, SelectProps } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";

import type {
  FormbuilderEditorField,
  FormbuilderEditorStore,
} from "../FormbuilderEditorStore";
import { elementsData } from "../element";
import { labelsClassName } from "../form-util";
import { isFieldOccupied } from "../util/fieldRelatedOperations";
import { getNewFieldKeynamePostfix } from "../util/newFieldKeyname";
import { useFieldValidationRules } from "../util/useFieldValidationRules";

import { FieldLabel } from "./FieldLabel";

import LockIcon from "@nextgisweb/icon/material/lock/outline";

const msgAdd = gettext("Add");
const msgFieldKeyname = gettext("Keyname");
const msgFieldDisplayName = gettext("Display name");
const msgFieldDataType = gettext("Data type");

type CreateFieldPopOvercontent = {
  store: FormbuilderEditorStore;
  fieldPropKeyname: string;
  addPendingNewField: (
    field: FormbuilderEditorField,
    fieldPropKeyname: string
  ) => void;
  pendingNewFields: FormbuilderEditorField[];
  closePopover: () => void;
};

const CreateFieldPopOverContent = observer(
  ({
    store,
    fieldPropKeyname,
    addPendingNewField,
    pendingNewFields,
    closePopover,
  }: CreateFieldPopOvercontent) => {
    const { rulesRequired, rulesKeyname, rulesDisplayName } =
      useFieldValidationRules(store.fields);

    const onFinish: FormProps<FormbuilderEditorField>["onFinish"] = (
      values
    ) => {
      const newFieldItem: FormbuilderEditorField = {
        ...values,
        existing: false,
      };

      addPendingNewField(newFieldItem, fieldPropKeyname);
      closePopover();
    };

    const newFieldPostfix = getNewFieldKeynamePostfix([
      ...store.fields,
      ...pendingNewFields,
    ]);

    const fullElementData = elementsData.find(
      (el) => el.elementId === store.grabbedInput?.value.type
    );

    const acceptableDataTypesOptions = fullElementData?.schema[
      fieldPropKeyname
    ].datatypes?.map((opt) => ({
      value: opt,
      label: opt,
    }));

    const initialValues = {
      keyname: `field_${newFieldPostfix}`,
      display_name: `${gettext("Field")} ${newFieldPostfix}`,
      datatype: acceptableDataTypesOptions?.at(0)?.value || "STRING",
    };

    return (
      <Form
        className={labelsClassName}
        labelAlign="left"
        name="AddNewFieldPopover"
        autoComplete="off"
        requiredMark={false}
        initialValues={initialValues}
        onFinish={onFinish}
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
          <Select options={acceptableDataTypesOptions} />
        </Form.Item>

        <Form.Item<FormbuilderEditorField>
          name="keyname"
          label={msgFieldKeyname}
          rules={rulesKeyname}
        >
          <Input />
        </Form.Item>

        <Form.Item label={null} style={{ textAlign: "end" }}>
          <Button type="primary" htmlType="submit">
            {msgAdd}
          </Button>
        </Form.Item>
      </Form>
    );
  }
);

CreateFieldPopOverContent.displayName = "CreateFieldPopOverContent";

type NewFieldButtonProps = {
  store: FormbuilderEditorStore;
  fieldPropKeyname: string;
  addPendingNewField: (val: FormbuilderEditorField, propName: string) => void;
  pendingNewFields: FormbuilderEditorField[];
};

const NewFieldButton = observer(
  ({
    store,
    fieldPropKeyname,
    addPendingNewField,
    pendingNewFields,
  }: NewFieldButtonProps) => {
    const [isNewFieldPopoverOpen, setIsNewFieldPopoverOpen] = useState(false);

    return (
      <Popover
        open={isNewFieldPopoverOpen}
        placement="bottomRight"
        content={
          <CreateFieldPopOverContent
            store={store}
            fieldPropKeyname={fieldPropKeyname}
            addPendingNewField={addPendingNewField}
            pendingNewFields={pendingNewFields}
            closePopover={() => setIsNewFieldPopoverOpen(false)}
          />
        }
        trigger="click"
        onOpenChange={setIsNewFieldPopoverOpen}
        destroyOnHidden
      >
        <Button onClick={() => setIsNewFieldPopoverOpen(true)}>{msgAdd}</Button>
      </Popover>
    );
  }
);

NewFieldButton.displayName = "NewFieldButton";

type FieldValue = Record<string, string>;

type FieldPropertiesModalConentProps = {
  store: FormbuilderEditorStore;
  type: string;
  setFieldsForInput: (data: FieldValue) => void;
  dispatchPendingNewField: (val: FormbuilderEditorField) => void;
};

const FieldSelect = observer<SelectProps & { addButton: ReactNode }>(
  ({ addButton, ...rest }) => (
    <Space.Compact style={{ width: "100%" }}>
      <Select styles={{ root: { minWidth: 0 } }} {...rest} />
      {addButton}
    </Space.Compact>
  )
);

FieldSelect.displayName = "FieldSelect";

export const FieldPropertiesModalConent = observer(
  ({
    store,
    type,
    setFieldsForInput,
    dispatchPendingNewField,
  }: FieldPropertiesModalConentProps) => {
    const currentElementData = elementsData.find((el) => el.elementId === type);

    if (!currentElementData) return null;

    const currentElementStoreData = currentElementData.storeData;

    const [form] = Form.useForm();
    const { token } = useToken();

    useEffect(() => {
      if (currentElementData) {
        form.setFieldsValue(currentElementStoreData.data);
      }

      return () => {
        form.resetFields();
      };
    }, [currentElementData, currentElementStoreData, form]);

    const currentInputSchema = currentElementData.schema;

    const fieldsFromSchema = Object.entries(currentInputSchema)
      .filter(([_key, value]) => value.type === "field")
      .map(([key, value]) => ({
        keyname: key,
        label: value.formLabel,
        ...value,
      }));

    const isFieldDisabledGlobally = (keyname: string) => {
      return isFieldOccupied(keyname as string, store.inputsTree);
    };

    const [fieldOptions, setFieldOptions] = useState(() => {
      return [
        ...store.fields.map((field) => ({
          value: field.keyname as string,
          label: field.display_name,
          disabled: isFieldDisabledGlobally(field.keyname as string),
        })),
      ];
    });

    const [pendingNewFields, setPendingNewFields] = useState<
      FormbuilderEditorField[]
    >([]);

    const updateDataUp = (formValues: any) => {
      const isAllFieldsSet =
        Object.values(formValues).filter((val) => {
          return val && val !== "" && val !== "-";
        }).length === fieldsFromSchema.length;

      if (isAllFieldsSet) {
        setFieldsForInput(formValues);
      }
    };

    const addPendingNewField = (
      fieldData: FormbuilderEditorField,
      formKeyname: string
    ) => {
      const isUnique = !pendingNewFields.find((f) => {
        return f.keyname === fieldData.keyname;
      });

      if (!isUnique) return;

      setPendingNewFields([...pendingNewFields, fieldData]);
      dispatchPendingNewField(fieldData);

      const newFieldOption = {
        value: fieldData.keyname,
        label: fieldData.display_name,
        disabled: true,
      };

      form.setFieldValue(formKeyname, newFieldOption.value);

      form.validateFields().then((result) => {
        updateDataUp(result);
      });

      const formValues = form.getFieldsValue();
      const isFieldUsedInModal = (field: string) =>
        Object.values(formValues).includes(field);

      setFieldOptions([
        ...fieldOptions.map((fieldOption) => {
          return {
            ...fieldOption,
            disabled:
              isFieldUsedInModal(fieldOption.value) ||
              isFieldDisabledGlobally(fieldOption.value),
          };
        }),
        newFieldOption,
      ]);
    };

    const onFormChange = () => {
      const formValues = form.getFieldsValue();

      const isFieldUsedInModal = (field: string) =>
        Object.values(formValues).includes(field);

      setFieldOptions(
        fieldOptions.map((fieldOption) => {
          return {
            ...fieldOption,
            disabled:
              isFieldUsedInModal(fieldOption.value) ||
              isFieldDisabledGlobally(fieldOption.value),
          };
        })
      );

      updateDataUp(formValues);
    };

    return (
      <Form
        className={labelsClassName}
        labelAlign="left"
        form={form}
        clearOnDestroy
        autoComplete="off"
        name="fbwFieldsModal"
        onFieldsChange={onFormChange}
      >
        <Form.Item label={gettext("Element type")}>
          <Input
            value={store.grabbedInput?.value.name}
            suffix={<LockIcon style={{ color: token.colorTextDisabled }} />}
            readOnly={true}
          />
        </Form.Item>
        {fieldsFromSchema.map((fieldProp, i) => (
          <Form.Item
            key={i}
            label={fieldProp.formLabel}
            name={fieldProp.keyname}
          >
            <FieldSelect
              options={fieldOptions.map((field) => {
                const fullFieldData = [
                  ...store.fields,
                  ...pendingNewFields,
                ].find((f) => f.keyname === field.value);

                const fieldDatatypeCheck =
                  fieldProp.datatypes && fullFieldData
                    ? !fieldProp?.datatypes.includes(fullFieldData?.datatype)
                    : false;

                const disabledDatatypeChecked =
                  field.disabled || fieldDatatypeCheck;

                return {
                  ...field,
                  label: (
                    <FieldLabel
                      label={field.label}
                      datatype={fullFieldData?.datatype}
                    />
                  ),
                  disabled: disabledDatatypeChecked,
                };
              })}
              addButton={
                <NewFieldButton
                  store={store}
                  fieldPropKeyname={fieldProp.keyname}
                  addPendingNewField={addPendingNewField}
                  pendingNewFields={pendingNewFields}
                />
              }
            />
          </Form.Item>
        ))}
      </Form>
    );
  }
);

FieldPropertiesModalConent.displayName = "FieldPropertiesModalConent";
