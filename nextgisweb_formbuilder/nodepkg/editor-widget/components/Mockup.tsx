import { Button } from "antd";
import { observer } from "mobx-react-lite";

import type { FormbuilderField } from "@nextgisweb/formbuilder/type/api";

import type { FormbuilderEditorStore } from "../FormbuilderEditorStore";
import { elements, isNonFieldElement } from "../elements_data";
import type {
    FormBuilderUIData,
    GrabbedInputComposite,
    UIListItem,
} from "../type";

import { DropPlace } from "./DropPlace";
import { getInputComponent } from "./InputElements";

import { CloseOutlined, HolderOutlined } from "@ant-design/icons";

interface MockupProps {
    inputsWithId: FormBuilderUIData | null;
    parentId?: number;
    store: FormbuilderEditorStore;
}

// Utility functions

const resetGrabState = (store: FormbuilderEditorStore) => {
    store.setGrabbedInput(null);
    store.setGrabbedSourceListId(null);
    store.setGrabbedIndex(null);
};

const addNewField = (store: FormbuilderEditorStore) => {
    const newFieldItem: FormbuilderField = {
        display_name: `Field ${store.fields.length + 1}`,
        keyname: `field_${store.fields.length + 1}`,
        datatype: "STRING",
    };
    store.setFields([...store.fields, newFieldItem]);
};

const createDroppingInput = (
    store: FormbuilderEditorStore,
    input: GrabbedInputComposite | undefined,
    isMoving?: boolean
): GrabbedInputComposite | undefined => {
    if (!input) return undefined;

    const getDroppingFieldValue = () => {
        if (isMoving) return input.data?.field;
        if (isNonFieldElement(input)) return undefined;
        return `field_${store.fields.length + 1}`;
    };

    return {
        ...input,
        data: {
            ...input.data,
            field: getDroppingFieldValue(),
        },
    };
};

// Drop position handlers
const getInputsForMoveBefore = (
    inputs: UIListItem[],
    dropIndex: number,
    grabbedIndex: number,
    droppingInput: UIListItem
) => {
    const pre = inputs.slice(0, dropIndex);
    const mid = inputs.slice(dropIndex, grabbedIndex);
    const post = inputs.slice(grabbedIndex + 2, inputs.length);

    return [
        ...pre,
        { value: { type: "dropPlace" }, data: null },
        droppingInput,
        ...mid,
        ...post,
    ];
};

const getInputsForMoveAfter = (
    inputs: UIListItem[],
    dropIndex: number,
    grabbedIndex: number,
    droppingInput: UIListItem
) => {
    const pre = inputs.slice(0, grabbedIndex);
    const mid = inputs.slice(grabbedIndex + 2, dropIndex);
    const post = inputs.slice(dropIndex, inputs.length);

    return [
        ...pre,
        ...mid,
        { value: { type: "dropPlace" }, data: null },
        droppingInput,
        ...post,
    ];
};

const handleDrop = (
    store: FormbuilderEditorStore,
    inputs: UIListItem[],
    listId: number,
    dropIndex: number,
    droppingInput?: GrabbedInputComposite
) => {
    if (!droppingInput) return;

    const pre = inputs.slice(0, dropIndex);
    const post = inputs.slice(dropIndex, inputs.length);

    const updatedInputs = [
        ...pre,
        { value: { type: "dropPlace" }, data: null },
        droppingInput,
        ...post,
    ];

    store.setListById(listId, updatedInputs);
    resetGrabState(store);
};

const handleExistingPositionDrop = (
    store: FormbuilderEditorStore,
    inputs: UIListItem[],
    listId: number,
    dropIndex: number,
    grabbedIndex: number,
    droppingInput: GrabbedInputComposite | null
) => {
    if (!droppingInput || Math.abs(dropIndex - grabbedIndex) < 2) {
        resetGrabState(store);
        return;
    }

    let updatedInputs;
    if (grabbedIndex > dropIndex) {
        updatedInputs = getInputsForMoveBefore(
            inputs,
            dropIndex,
            grabbedIndex,
            droppingInput
        );
    } else {
        updatedInputs = getInputsForMoveAfter(
            inputs,
            dropIndex,
            grabbedIndex,
            droppingInput
        );
    }

    store.setListById(listId, updatedInputs);
    resetGrabState(store);
};

const handleDropLogic = (
    store: FormbuilderEditorStore,
    inputs: UIListItem[],
    listId: number,
    dropIndex: number
    // parentId?: number
) => {
    const { grabbedInput, grabbedSourceListId, grabbedIndex, isMoving } = store;

    if (!grabbedInput) return;

    const isExistingList = () => typeof grabbedSourceListId === "number";
    const isSameList = () => isExistingList() && grabbedSourceListId === listId;
    const isDifferenceOne = () => {
        if (grabbedIndex === null) return false;
        return Math.abs(grabbedIndex - dropIndex) === 1;
    };

    const isSameListSamePlace =
        isExistingList() && isSameList() && isDifferenceOne();

    if (grabbedInput.dropCallback && isExistingList() && !isSameListSamePlace) {
        grabbedInput.dropCallback();
    }

    const droppingInputWithField = createDroppingInput(
        store,
        grabbedInput,
        isMoving
    );

    if (!droppingInputWithField) {
        resetGrabState(store);
        return;
    }

    if (!isMoving && !isNonFieldElement(droppingInputWithField)) {
        addNewField(store);
    }

    if (listId !== grabbedSourceListId) {
        handleDrop(store, inputs, listId, dropIndex, droppingInputWithField);
        return;
    }

    if (grabbedIndex === null) {
        handleDrop(store, inputs, listId, dropIndex, droppingInputWithField);
    } else {
        handleExistingPositionDrop(
            store,
            inputs,
            listId,
            dropIndex,
            grabbedIndex,
            droppingInputWithField
        );
    }
};

// Render functions
const renderDropPlace = (
    store: FormbuilderEditorStore,
    input: UIListItem,
    index: number,
    inputs: UIListItem[],
    listId: number,
    parentId?: number
) => {
    const handleDrop = () => {
        if (!store.grabbedInput) return;

        if (
            store.grabbedInput.id &&
            parentId &&
            store.isNestedWithin(store.grabbedInput.id, parentId)
        ) {
            return;
        }

        handleDropLogic(store, inputs, listId, index);
    };

    return (
        <DropPlace
            active={!!store.grabbedInput}
            key={`${input.value.type}_${index}`}
            elId={index}
            onDrop={handleDrop}
        />
    );
};

export const getInputElement = ({
    store,
    input,
    index,
    handleMouseDown,
    handleDelete,
    onMouseUp,
}: {
    store: FormbuilderEditorStore;
    input: UIListItem;
    index: number;
    handleMouseDown?: () => void;
    handleDelete?: () => void;
    onMouseUp?: () => void;
}) => {
    const InputComponent = getInputComponent(input.value.type);

    return (
        <div
            key={index}
            className={
                store.selectedInput?.id === input.id
                    ? "mockup_input_element_wrapper_fbwidget--selected"
                    : "mockup_input_element_wrapper_fbwidget"
            }
        >
            <div
                style={{
                    flexGrow: "10",
                    display: "flex",
                    gap: "6px",
                    width: "100%",
                    userSelect: "none",
                }}
            >
                <HolderOutlined
                    style={{
                        color: "grey",
                        paddingLeft: "6px",
                        cursor: "grab",
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseUp={onMouseUp}
                />
                <InputComponent
                    store={store}
                    onGrabDrop={() => store.grabbedInput}
                    input={input}
                    i={index}
                />
            </div>
            <Button
                style={{ margin: "2px" }}
                shape="circle"
                type="text"
                icon={
                    <CloseOutlined
                        style={{
                            fontSize: 14,
                            paddingBottom: "2px",
                        }}
                    />
                }
                onClick={handleDelete}
            />
        </div>
    );
};

const renderInputElement = (
    store: FormbuilderEditorStore,
    input: UIListItem,
    index: number,
    inputs: UIListItem[],
    listId: number
) => {
    if (!input?.value) return null;

    const handleMouseDown = () => {
        const grabbed = elements.find((e) => e.value.type === input.value.type);
        if (!grabbed) return;
        store.setDragging(true);
        store.setGrabbedIndex(index);
        store.setGrabbedSourceListId(listId);
        store.setGrabbedInput({
            ...input,
            dropCallback: () => {
                const updatedInputs = [
                    ...inputs.slice(0, index),
                    ...inputs.slice(index + 2, inputs.length),
                ];
                store.setListById(listId, updatedInputs);
            },
        });
        store.setIsMoving(true);
    };

    const handleDelete = () => {
        if (input.id === store.selectedInput?.id) {
            store.setSelectedInput(null);
        }
        const updatedInputs = [
            ...inputs.slice(0, index),
            ...inputs.slice(index + 2, inputs.length),
        ];
        store.setListById(listId, updatedInputs);
    };

    const onMouseUp = () => store.setGrabbedInput(null);

    return getInputElement({
        store,
        index,
        input,
        handleDelete,
        onMouseUp,
        handleMouseDown,
    });
};

// Main component
export const Mockup = observer(
    ({ inputsWithId, parentId, store }: MockupProps) => {
        if (!inputsWithId) return null;

        const { list: inputs, listId } = inputsWithId;

        return (
            <div className="mockup_main_fbwidget">
                {inputs?.map((input, i) =>
                    input?.value?.type === "dropPlace"
                        ? renderDropPlace(
                              store,
                              input,
                              i,
                              inputs,
                              listId,
                              parentId
                          )
                        : renderInputElement(store, input, i, inputs, listId)
                )}
            </div>
        );
    }
);

Mockup.displayName = "Mockup";
