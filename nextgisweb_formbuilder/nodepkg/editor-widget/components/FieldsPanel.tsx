import { observer } from "mobx-react-lite";

import type { FeatureLayerFieldDatatype } from "@nextgisweb/feature-layer/type/api";
import type { FormbuilderField } from "@nextgisweb/formbuilder/type/api";
import { Button, Input, Select } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";

import type { FormbuilderEditorStore } from "../FormbuilderEditorStore";

import { CloseOutlined } from "@ant-design/icons";

const typeOptions: { value: string; label: string }[] = [
    { value: "STRING", label: "String" },
    { value: "INTEGER", label: "Integer" },
    { value: "BIGINT", label: "Big Integer" },
    { value: "REAL", label: "Real" },
    { value: "DATE", label: "Date" },
    { value: "TIME", label: "Time" },
    { value: "DATETIME", label: "Date Time" },
];

const msgAddField = gettext("Add field");
const msgFieldsPanelHeader = gettext("Fields");

export const FieldsPanel = observer(
    ({ store }: { store: FormbuilderEditorStore }) => {
        const addField = () => {
            const newFieldItem: FormbuilderField = {
                display_name: `Field ${store.fields.length + 1}`,
                keyname: `field_${store.fields.length + 1}`,
                datatype: "STRING",
            };

            const fields = store.fields;
            store.setFields([...fields, newFieldItem]);
        };

        const handleFieldChange = (
            keyname: string,
            newData: Partial<FormbuilderField>
        ) => {
            store.updateField(keyname, newData);
        };

        return (
            <div>
                <div className="panel-header">{msgFieldsPanelHeader}</div>
                {store.fields.map((field) => (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "4px",
                            margin: "0px 4px 0px 4px",
                        }}
                        key={field.keyname}
                    >
                        <Input
                            size="small"
                            style={{ width: "120px", height: "32px" }}
                            value={field.display_name}
                            onChange={(e) => {
                                handleFieldChange(field.keyname, {
                                    display_name: e.target.value,
                                });
                            }}
                        />
                        <Select
                            style={{ width: "120px" }}
                            options={typeOptions}
                            defaultValue={
                                typeOptions[0]
                                    .value as FeatureLayerFieldDatatype
                            }
                            value={field.datatype}
                            onChange={(value: FeatureLayerFieldDatatype) => {
                                handleFieldChange(field.keyname, {
                                    datatype: value,
                                });
                            }}
                        />
                        <Button
                            style={{ margin: "2px" }}
                            type="text"
                            shape="circle"
                            icon={<CloseOutlined />}
                            onClick={() => {
                                const updatedFieldsList = store.fields.filter(
                                    (onDeleteField) =>
                                        onDeleteField.keyname !== field.keyname
                                );

                                store.setFields(updatedFieldsList);
                            }}
                        />
                    </div>
                ))}
                <Button
                    style={{ margin: "0px 0px 0px 4px", width: "120px" }}
                    onClick={addField}
                >
                    {msgAddField}
                </Button>
            </div>
        );
    }
);

FieldsPanel.displayName = "FieldsPanel";
