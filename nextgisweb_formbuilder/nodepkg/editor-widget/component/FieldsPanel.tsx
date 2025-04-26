import { observer } from "mobx-react-lite";

import type { FeatureLayerFieldDatatype } from "@nextgisweb/feature-layer/type/api";
import {
    Button,
    CheckboxValue,
    InputValue,
    Select,
} from "@nextgisweb/gui/antd";
import { useThemeVariables } from "@nextgisweb/gui/hook";
import { ErrorIcon, RemoveIcon } from "@nextgisweb/gui/icon";
import { gettext } from "@nextgisweb/pyramid/i18n";

import type {
    FormbuilderEditorField,
    FormbuilderEditorStore,
} from "../FormbuilderEditorStore";
import {
    getElementIdByField,
    isFieldOccupied,
} from "../util/fieldRelatedOperations";
import { getNewFieldKeynamePostfix } from "../util/newFieldKeyname";

import NewUsedFieldIcon from "@nextgisweb/icon/material/add_link/outline";
import ExistingUsedFieldIcon from "@nextgisweb/icon/material/link/outline";
import ExistingUnusedFieldIcon from "@nextgisweb/icon/material/link_off/outline";
import ExistingFieldLockIcon from "@nextgisweb/icon/material/lock/outline";

import "./FieldsPanel.less";

const typeOptions: { value: string; label: string }[] = [
    { value: "STRING", label: "STRING" },
    { value: "INTEGER", label: "INTEGER" },
    { value: "BIGINT", label: "BIGINT" },
    { value: "REAL", label: "REAL" },
    { value: "DATE", label: "DATE" },
    { value: "TIME", label: "TIME" },
    { value: "DATETIME", label: "DATETIME" },
];

const msgAdd = gettext("Add");
const msgFieldsPanelHeader = gettext("Fields");
const msgAddToLayer = gettext("Add absent fields to layer");

export const FieldsPanel = observer(
    ({ store }: { store: FormbuilderEditorStore }) => {
        const addField = () => {
            const newFieldPostfix = getNewFieldKeynamePostfix(store.fields);

            const newFieldItem: FormbuilderEditorField = {
                display_name: `${gettext("Field")} ${newFieldPostfix}`,
                keyname: `field_${newFieldPostfix}`,
                datatype: "STRING",
                existing: false,
            };

            const fields = store.fields;
            store.setFields([...fields, newFieldItem]);
            if (store.setDirty) store.setDirty(true);
        };

        const handleFieldChange = (
            keyname: string,
            newData: Partial<FormbuilderEditorField>
        ) => {
            store.updateField(keyname, newData);
            if (store.setDirty) store.setDirty(true);
        };

        const deleteField = (field: FormbuilderEditorField) => {
            const updatedFieldsList = store.fields.filter(
                (onDeleteField) => onDeleteField.keyname !== field.keyname
            );

            if (isFieldOccupied(field.keyname, store.inputsTree)) {
                const elIdtoCleanField = getElementIdByField(
                    field.keyname,
                    store.inputsTree
                );

                if (elIdtoCleanField >= 0) {
                    const elementToClean =
                        store.getElementById(elIdtoCleanField);

                    const dataEntries = Object.entries(elementToClean?.data);

                    const updatedDataEntries = dataEntries.map(
                        ([key, value]) => {
                            if (value === field.keyname) {
                                return [key, "-"];
                            } else {
                                return [key, value];
                            }
                        }
                    );
                    const updatedData = Object.fromEntries(updatedDataEntries);

                    store.setNewElementData(elIdtoCleanField, {
                        ...updatedData,
                    });
                }
            }

            store.setFields(updatedFieldsList);
        };

        const getStatusIcon = (field: FormbuilderEditorField) => {
            const isUsed = isFieldOccupied(field.keyname, store.inputsTree);
            if (field.existing) {
                return isUsed ? (
                    <ExistingUsedFieldIcon
                        style={{ color: "var(--theme-color-success)" }}
                    />
                ) : (
                    <ExistingUnusedFieldIcon
                        style={{ color: "var(--theme-color-disabled)" }}
                    />
                );
            } else if (isUsed && store.canUpdateFields) {
                return store.updateFeatureLayerFields ? (
                    <NewUsedFieldIcon
                        style={{ color: "var(--theme-color-success)" }}
                    />
                ) : (
                    <ErrorIcon
                        style={{ color: "var(--theme-color-warning)" }}
                    />
                );
            } else if (isUsed && !store.canUpdateFields) {
                return (
                    <ErrorIcon
                        style={{ color: "var(--theme-color-warning)" }}
                    />
                );
            } else if (!isUsed) {
                return (
                    <ErrorIcon
                        style={{ color: "var(--theme-color-warning)" }}
                    />
                );
            } else {
                return <></>;
            }
        };

        const themeVariables = useThemeVariables({
            "theme-color-disabled": "colorTextDisabled",
            "theme-color-warning": "colorWarning",
            "theme-color-success": "colorSuccess",
        });

        return (
            <div
                className="ngw-formbuilder-editor-widget-fields-panel"
                style={themeVariables}
            >
                <div className="panel-header">
                    {msgFieldsPanelHeader}
                    <Button
                        size="small"
                        style={{ marginInlineStart: "auto" }}
                        onClick={addField}
                    >
                        {msgAdd}
                    </Button>
                </div>
                <div className="fields-container">
                    <div className="fields">
                        {store.fields.map((field, i) => (
                            <div key={field.keyname + i} className="field-row">
                                <div className="status">
                                    {getStatusIcon(field)}
                                </div>
                                <InputValue
                                    className="display-name"
                                    variant="borderless"
                                    size="small"
                                    value={field.display_name}
                                    readOnly={field.existing}
                                    onChange={(value) => {
                                        handleFieldChange(field.keyname, {
                                            display_name: value,
                                        });
                                    }}
                                />
                                <Select
                                    className="datatype"
                                    variant="borderless"
                                    options={typeOptions}
                                    suffixIcon={
                                        field.existing ? <></> : undefined
                                    }
                                    open={field.existing ? false : undefined}
                                    style={
                                        field.existing
                                            ? { cursor: "default" }
                                            : undefined
                                    }
                                    defaultValue={
                                        typeOptions[0]
                                            .value as FeatureLayerFieldDatatype
                                    }
                                    value={field.datatype}
                                    onChange={(
                                        value: FeatureLayerFieldDatatype
                                    ) => {
                                        if (field.existing) return;
                                        handleFieldChange(field.keyname, {
                                            datatype: value,
                                        });
                                    }}
                                />

                                <div className="action">
                                    <Button
                                        size="small"
                                        type="text"
                                        icon={
                                            field.existing ? (
                                                <ExistingFieldLockIcon />
                                            ) : (
                                                <RemoveIcon />
                                            )
                                        }
                                        disabled={field.existing}
                                        style={
                                            field.existing
                                                ? { cursor: "default" }
                                                : undefined
                                        }
                                        onClick={() => deleteField(field)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {store.fields.find((field) => !field.existing) &&
                    store.canUpdateFields && (
                        <div className="update-fields">
                            <CheckboxValue
                                value={store.updateFeatureLayerFields}
                                onChange={store.setUpdateFeatureLayerFields}
                            >
                                {msgAddToLayer}
                            </CheckboxValue>
                        </div>
                    )}
            </div>
        );
    }
);

FieldsPanel.displayName = "FieldsPanel";
