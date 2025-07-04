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
import { elementsData } from "../element";
import { fieldDataTypeOptions } from "../fields";
import {
    getElementIdByField,
    isFieldOccupied,
} from "../util/fieldRelatedOperations";

import { AddFieldModalButton } from "./AddFieldModalButton";

import NewUsedFieldIcon from "@nextgisweb/icon/material/add_link/outline";
import ExistingUsedFieldIcon from "@nextgisweb/icon/material/link/outline";
import ExistingUnusedFieldIcon from "@nextgisweb/icon/material/link_off/outline";
import ExistingFieldLockIcon from "@nextgisweb/icon/material/lock/outline";

import "./FieldsPanel.less";

const msgFieldsPanelHeader = gettext("Fields");
const msgAddToLayer = gettext("Add absent fields to layer");

export const FieldsPanel = observer(
    ({ store }: { store: FormbuilderEditorStore }) => {
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

        const getFilteredFieldDataTypeOptions = (fieldKeyname: string) => {
            const boundElementId = getElementIdByField(
                fieldKeyname,
                store.inputsTree
            );
            if (boundElementId === -1) {
                return fieldDataTypeOptions;
            }

            const boundElement = store.getElementById(boundElementId);

            const boundElementFieldProp = Object.entries(boundElement?.data)
                .find(([_key, value]) => value === fieldKeyname)
                ?.at(0);

            const boundPropSchemaEntry = elementsData.find(
                (el) => el.elementId === boundElement?.value.type
            )?.schema[boundElementFieldProp as string];

            const propAcceptableDatatypes = boundPropSchemaEntry?.datatypes;

            return fieldDataTypeOptions.map((option) => ({
                ...option,
                disabled: !propAcceptableDatatypes?.includes(option.value),
            }));
        };

        const themeVariables = useThemeVariables({
            "theme-color-disabled": "colorTextDisabled",
            "theme-color-warning": "colorWarning",
            "theme-color-success": "colorSuccess",
        });

        return (
            <div
                className="ngw-formbuilder-editor-widget-panel ngw-formbuilder-editor-widget-panel-fields"
                style={themeVariables}
            >
                <div className="panel-header">
                    {msgFieldsPanelHeader}
                    <AddFieldModalButton store={store} />
                </div>
                <div className="panel-body">
                    {store.fields.map((field, i) => {
                        const datatypeSelectOptions =
                            getFilteredFieldDataTypeOptions(field.keyname);

                        const defaultValue =
                            datatypeSelectOptions.find((opt) => !opt.disabled)
                                ?.value || datatypeSelectOptions[0].value;

                        const deletable =
                            !field.existing &&
                            !isFieldOccupied(field.keyname, store.inputsTree);

                        return (
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
                                    options={datatypeSelectOptions}
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
                                        defaultValue as FeatureLayerFieldDatatype
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
                                            deletable ? (
                                                <RemoveIcon />
                                            ) : (
                                                <ExistingFieldLockIcon />
                                            )
                                        }
                                        disabled={!deletable}
                                        style={
                                            deletable
                                                ? undefined
                                                : { cursor: "default" }
                                        }
                                        onClick={() => deleteField(field)}
                                    />
                                </div>
                            </div>
                        );
                    })}
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
