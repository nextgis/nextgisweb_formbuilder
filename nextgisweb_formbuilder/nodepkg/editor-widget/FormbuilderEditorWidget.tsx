import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";

import type { FormbuilderField } from "@nextgisweb/formbuilder/type/api";
import { useThemeVariables } from "@nextgisweb/gui/hook";
import { gettext } from "@nextgisweb/pyramid/i18n";

import { FormbuilderEditorStore } from "./FormbuilderEditorStore";
import type { FormbuilderValue } from "./FormbuilderEditorStore";
import { ElementsPanel } from "./components/ElementsPanel";
import { FieldsPanel } from "./components/FieldsPanel";
import { Mockup, getInputElement } from "./components/Mockup";
import { SelectedInputProperties } from "./components/SelectedInputProperties";
import { isNonFieldElement } from "./elements_data";
import { convertToUIData } from "./util/serializeData";

import DoneIcon from "@nextgisweb/icon/material/check";
import ArrowIcon from "@nextgisweb/icon/material/keyboard_arrow_left";
import MoreVertIcon from "@nextgisweb/icon/material/more_vert";

import "./FormbuilderEditorWidget.css";

export const FormbuilderEditorWidget = observer(
    ({
        value,
        store: storeProp,
        onChange,
    }: {
        value?: any;
        store?: FormbuilderEditorStore;
        onChange?: (val: FormbuilderValue) => void;
    }) => {
        const [store] = useState(
            () => storeProp || new FormbuilderEditorStore({ onChange })
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

                const html = document.documentElement;

                if (dragging) {
                    html.classList.add("dragging-active");
                } else {
                    html.classList.remove("dragging-active");
                }
                return () => {
                    document.removeEventListener("mousemove", handleMouseMove);
                    html.classList.remove("dragging-active");
                };
            }
        }, [dragging, setDragPos]);

        useEffect(() => {
            const handleMouseUp = () => {
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
        });

        return (
            <div
                className={classNames("formbuilder_main_fbwidget", {
                    "formbuilder_main_drag_fbwidget": dragging,
                })}
                style={themeVariables}
            >
                <ElementsPanel store={store} />

                <div className="mockup_background_field_fbwidget">
                    <div
                        className={"mockup_wrapper_top_level_fbwidget"}
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
                                    const newFieldItem: FormbuilderField = {
                                        display_name: `Field ${
                                            fields.length + 1
                                        }`,
                                        keyname: `field_${fields.length + 1}`,
                                        datatype: "STRING",
                                    };

                                    store.setFields([...fields, newFieldItem]);
                                }

                                // It happens to be unique top level in tree case, prolly can be recursive like other cases
                                const updatedInputs = [
                                    ...inputsTree.list,
                                    droppingInputWithField,
                                    {
                                        value: { type: "dropPlace" },
                                        data: null,
                                    },
                                ];
                                store.setInputsTree({
                                    listId: 0,
                                    list: updatedInputs,
                                });
                            }
                        }}
                    >
                        <div className="mockup_app_header_fbwidget">
                            <ArrowIcon
                                style={{ fontSize: "32px", color: "white" }}
                            />
                            <div style={{ display: "flex" }}>
                                <DoneIcon
                                    style={{
                                        fontSize: "32px",
                                        color: "white",
                                    }}
                                />
                                <MoreVertIcon
                                    style={{
                                        fontSize: "30px",
                                        color: "white",
                                    }}
                                />
                            </div>
                        </div>

                        <Mockup inputsWithId={inputsTree} store={store} />
                    </div>
                </div>

                <div className={"settings_fbwidget"}>
                    <div className={"data_fbwidget"}>
                        <FieldsPanel store={store} />
                    </div>

                    <div className={"props_fbwidget"}>
                        <SelectedInputProperties store={store} />
                    </div>
                </div>

                {dragging && grabbedInput && (
                    <div
                        style={{
                            position: "fixed",
                            cursor: "grabbing",
                            left: dragPos.x,
                            top: dragPos.y,
                            transform: "translate(-50%, -50%)",
                            pointerEvents: "none",
                            opacity: 0.5,
                            zIndex: 1000,
                            minWidth: "200px",
                        }}
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
