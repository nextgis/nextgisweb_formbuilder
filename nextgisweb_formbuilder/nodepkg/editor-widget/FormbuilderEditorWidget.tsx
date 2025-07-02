import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";

import { useThemeVariables } from "@nextgisweb/gui/hook";
import { route } from "@nextgisweb/pyramid/api/route";
import { gettext } from "@nextgisweb/pyramid/i18n";

import { FormbuilderEditorStore } from "./FormbuilderEditorStore";
import type {
    FormbuilderEditorField,
    FormbuilderValue,
} from "./FormbuilderEditorStore";
import { ElementsPanel } from "./component/ElementsPanel";
import { FieldsPanel } from "./component/FieldsPanel";
import { Mockup, getInputElement } from "./component/Mockup";
import { PropertiesPanel } from "./component/PropertiesPanel";
import { isNonFieldElement } from "./element";
import { getNewFieldKeynamePostfix } from "./util/newFieldKeyname";
import { convertToUIData } from "./util/serializeData";

import DoneIcon from "@nextgisweb/icon/material/check";
import ArrowIcon from "@nextgisweb/icon/material/keyboard_arrow_left";
import MoreVertIcon from "@nextgisweb/icon/material/more_vert";

import "./FormbuilderEditorWidget.less";

export const FormbuilderEditorWidget = observer(
    ({
        value,
        store: storeProp,
        parent,
        onChange,
        setDirty,
    }: {
        value?: any;
        store?: FormbuilderEditorStore;
        parent?: number | null | undefined;
        onChange?: (val: FormbuilderValue) => void;
        setDirty?: (val: boolean) => void;
    }) => {
        const [store] = useState(
            () =>
                storeProp || new FormbuilderEditorStore({ onChange, setDirty })
        );

        const {
            fields,
            dragPos,
            dragging,
            isMoving,
            inputsTree,
            grabbedInput,
            setDragPos,
        } = store;

        useEffect(() => {
            if (parent && typeof parent === "number") {
                const getParentInfo = async (resourceId: number) => {
                    const resourceInfo = await route(
                        "resource.item",
                        resourceId
                    ).get({
                        cache: true,
                    });

                    if (resourceInfo.vector_layer?.geometry_type) {
                        store.setGeometryType(
                            resourceInfo.vector_layer?.geometry_type
                        );
                    }

                    const resourceMoreInfo = await route(
                        "resource.permission",
                        resourceId
                    ).get({
                        cache: true,
                    });

                    store.setCanUpdateFields(resourceMoreInfo.resource.update);

                    const parentFieldsNormalized = (
                        resourceInfo.feature_layer?.fields || []
                    ).map(
                        ({
                            keyname,
                            display_name,
                            datatype,
                        }): FormbuilderEditorField => ({
                            keyname,
                            display_name,
                            datatype,
                            existing: true,
                        })
                    );

                    const filteredFormFields = store.fields.filter((field) => {
                        return !parentFieldsNormalized.find(
                            (item) => item.keyname === field.keyname
                        );
                    });

                    store.setFields([
                        ...parentFieldsNormalized,
                        ...filteredFormFields,
                    ]);
                };
                getParentInfo(parent);
            }
        }, [parent, store]);

        useEffect(() => {
            if (value) {
                store.setFields(value?.value?.fields || []);

                const tree = convertToUIData(
                    value?.value?.items || [],
                    store.getNewListIndex
                );
                store.setInputsTree(tree);
            }
        }, [store, value]);

        useEffect(() => {
            if (dragging) {
                const handleMouseMove = (e: MouseEvent) => {
                    setDragPos({ x: e.clientX, y: e.clientY });
                };

                document.addEventListener("mousemove", handleMouseMove);

                return () => {
                    document.removeEventListener("mousemove", handleMouseMove);
                };
            }
        }, [dragging, setDragPos]);

        useEffect(() => {
            const handleMouseUp = (event: MouseEvent) => {
                const targetEl = event?.target as HTMLElement;

                const regexInModalElements = /(drop-place|ant-select-item)/;

                const isNewElementDrop =
                    !store.isMoving &&
                    regexInModalElements.test(targetEl?.className);

                const isInModalDropdown = targetEl?.closest(
                    ".ant-select-dropdown"
                );

                const isModalActive = targetEl?.closest(".ant-modal-wrap");
                const isPopoverActive = targetEl?.closest(".ant-popover");

                if (
                    isNewElementDrop ||
                    isModalActive ||
                    isInModalDropdown ||
                    isPopoverActive
                ) {
                    return;
                }

                store.setGrabbedInput(null);
                store.setIsMoving(false);
                store.setDragging(false);
            };

            document.addEventListener("mouseup", handleMouseUp);

            return () => {
                document.removeEventListener("mouseup", handleMouseUp);
            };
        }, [store]);

        const themeVariables = useThemeVariables({
            "theme-border-radius": "borderRadius",
            "theme-color-border-secondary": "colorBorderSecondary",
            "theme-color-border": "colorBorder",
            "theme-color-fill-alter": "colorFillAlter",
            "theme-color-icon": "colorIcon",
            "theme-color-primary-bg": "colorPrimaryBg",
            "theme-color-primary": "colorPrimary",
        });

        return (
            <div
                className={classNames("ngw-formbuilder-editor-widget", {
                    dragging,
                })}
                style={themeVariables}
            >
                <ElementsPanel store={store} />

                <div className="mockup-container">
                    <div
                        className={"mockup"}
                        onMouseUp={(e) => {
                            if (
                                e.currentTarget === e.target &&
                                !!grabbedInput
                            ) {
                                if (grabbedInput?.value.type) {
                                    if (
                                        grabbedInput?.dropCallback &&
                                        isMoving
                                    ) {
                                        grabbedInput.dropCallback();
                                    }
                                }

                                // PLS REFACTOR
                                // Prepare dropping input with field linked
                                // and add field to store

                                const getDroppingFieldValue = () => {
                                    if (isMoving) {
                                        return grabbedInput?.data?.field;
                                    }

                                    if (isNonFieldElement(grabbedInput)) {
                                        return undefined;
                                    }

                                    return `field_${fields.length + 1}`;
                                };

                                const droppingInputWithField = {
                                    ...grabbedInput,
                                    data: {
                                        ...grabbedInput.data,
                                        field: getDroppingFieldValue(),
                                    },
                                };

                                if (
                                    !isMoving &&
                                    !isNonFieldElement(droppingInputWithField)
                                ) {
                                    const newFieldPostfix =
                                        getNewFieldKeynamePostfix(store.fields);

                                    const newFieldItem: FormbuilderEditorField =
                                        {
                                            display_name: `${gettext("Field")} ${newFieldPostfix}`,
                                            keyname: `field_${newFieldPostfix}`,
                                            datatype: "STRING",
                                            existing: false,
                                        };

                                    store.setFields([...fields, newFieldItem]);
                                }

                                // It happens to be unique top level in tree
                                // case, prolly can be recursive like other
                                // cases
                                const updatedInputs = [
                                    ...inputsTree.list,
                                    droppingInputWithField,
                                ];
                                store.setInputsTree({
                                    listId: 0,
                                    list: updatedInputs,
                                });

                                if (store.setDirty) store.setDirty(true);
                            }
                        }}
                    >
                        <div className="mockup-header">
                            <ArrowIcon />
                            <DoneIcon />
                            <MoreVertIcon />
                        </div>
                        <div className="mockup-body-container">
                            <div className="mockup-body">
                                <Mockup
                                    inputsWithId={inputsTree}
                                    store={store}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="fields-and-properties">
                    <FieldsPanel store={store} />
                    {store.selectedInput && <PropertiesPanel store={store} />}
                </div>

                {dragging && grabbedInput && dragPos && (
                    <div
                        className="grabbed-input"
                        style={{ left: dragPos.x, top: dragPos.y }}
                    >
                        {getInputElement({
                            store,
                            index: -1,
                            input: grabbedInput,
                        })}
                    </div>
                )}
            </div>
        );
    }
);

FormbuilderEditorWidget.displayName = gettext("Form");

export default FormbuilderEditorWidget;
