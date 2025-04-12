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
import { ElementsPanel } from "./components/ElementsPanel";
import { FieldsPanel } from "./components/FieldsPanel";
import { Mockup, getInputElement } from "./components/Mockup";
import { SelectedInputProperties } from "./components/SelectedInputProperties";
import { isNonFieldElement } from "./elements_data";
import { getNewFieldKeyname } from "./util/newFieldKeyname";
import { convertToUIData } from "./util/serializeData";

import DoneIcon from "@nextgisweb/icon/material/check";
import ArrowIcon from "@nextgisweb/icon/material/keyboard_arrow_left";
import MoreVertIcon from "@nextgisweb/icon/material/more_vert";

import "./FormbuilderEditorWidget.css";

export const FormbuilderEditorWidget = observer(
    ({
        value,
        store: storeProp,
        parent,
        onChange,
    }: {
        value?: any;
        store?: FormbuilderEditorStore;
        parent?: number | null | undefined;
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
                                    const newKeyname = getNewFieldKeyname(
                                        store.fields
                                    );

                                    const newFieldItem: FormbuilderEditorField =
                                        {
                                            display_name: newKeyname,
                                            keyname: newKeyname,
                                            datatype: "STRING",
                                            existing: false,
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
                    <FieldsPanel store={store} />

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
