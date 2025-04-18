import { Button } from "antd";
import classNames from "classnames";
import { observer } from "mobx-react-lite";

import { RemoveIcon } from "@nextgisweb/gui/icon";
import { gettext } from "@nextgisweb/pyramid/i18n";

import type {
    FormbuilderEditorField,
    FormbuilderEditorStore,
} from "../FormbuilderEditorStore";
import { elementsData, isNonFieldElement } from "../element";
import type {
    FormBuilderUIData,
    GrabbedInputComposite,
    UIListItem,
} from "../type";
import { getNewFieldKeynamePostfix } from "../util/newFieldKeyname";

import { DropPlace } from "./DropPlace";

import { HolderOutlined } from "@ant-design/icons";

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
    const newFieldPostfix = getNewFieldKeynamePostfix(store.fields);

    const newFieldItem: FormbuilderEditorField = {
        display_name: `${gettext("Field")} ${newFieldPostfix}`,
        keyname: `field_${newFieldPostfix}`,
        datatype: "STRING",
        existing: false,
    };

    store.setFields([...store.fields, newFieldItem]);
    if (store.setDirty) store.setDirty(true);
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
        return "field_" + getNewFieldKeynamePostfix(store.fields);
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
    const post = inputs.slice(grabbedIndex, inputs.length);

    return [...pre, droppingInput, ...mid, ...post];
};

const getInputsForMoveAfter = (
    inputs: UIListItem[],
    dropIndex: number,
    grabbedIndex: number,
    droppingInput: UIListItem
) => {
    const pre = inputs.slice(0, grabbedIndex);
    const mid = inputs.slice(grabbedIndex, dropIndex - 1);
    const post = inputs.slice(dropIndex - 1, inputs.length);

    return [...pre, ...mid, droppingInput, ...post];
};

const handleDrop = (
    store: FormbuilderEditorStore,
    listId: number,
    dropIndex: number,
    droppingInput?: GrabbedInputComposite
) => {
    if (!droppingInput) return;

    const inputsListStore = store.getListById(listId)?.list || [];

    const pre = inputsListStore.slice(0, dropIndex);
    const post = inputsListStore.slice(dropIndex, inputsListStore.length);

    const updatedInputs = [...pre, droppingInput, ...post];

    store.setListById(listId, updatedInputs);
    if (store.setDirty) store.setDirty(true);
    resetGrabState(store);
};

const handleExistingPositionDrop = (
    store: FormbuilderEditorStore,
    listId: number,
    dropIndex: number,
    grabbedIndex: number,
    droppingInput: GrabbedInputComposite | null
) => {
    if (!droppingInput || [0, 1].includes(dropIndex - grabbedIndex)) {
        resetGrabState(store);
        // BUT SEEMS IN THIS CASE DROP CALLBACK STILL RUNS AND MAYBE ITS BAD
        return;
    }

    const inputsListStore = store.getListById(listId)?.list || [];

    let updatedInputs;
    if (grabbedIndex > dropIndex) {
        updatedInputs = getInputsForMoveBefore(
            inputsListStore,
            dropIndex,
            grabbedIndex,
            droppingInput
        );
    } else {
        updatedInputs = getInputsForMoveAfter(
            inputsListStore,
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
    listId: number,
    dropIndex: number
) => {
    const { grabbedInput, grabbedSourceListId, grabbedIndex, isMoving } = store;

    if (!grabbedInput) return;

    const isExistingList = () => typeof grabbedSourceListId === "number";
    const isSameList = () => isExistingList() && grabbedSourceListId === listId;
    const isDifferenceOne = () => {
        if (grabbedIndex === null) return false;
        return [0, 1].includes(dropIndex - grabbedIndex);
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
        handleDrop(store, listId, dropIndex, droppingInputWithField);
        return;
    }

    if (grabbedIndex === null) {
        handleDrop(store, listId, dropIndex, droppingInputWithField);
    } else {
        handleExistingPositionDrop(
            store,
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
    index: number,
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

        handleDropLogic(store, listId, index);
    };

    return (
        <DropPlace
            active={!!store.grabbedInput}
            key={`drop_${index * 2 + 1}`}
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
    const InputComponent =
        elementsData.find((el) => el.elementId === input.value.type)?.render ||
        (() => null);

    return (
        <div
            key={index}
            className={classNames(
                "ngw-formbuilder-editor-widget-mockup-element-wrapper",
                { selected: store.selectedInput?.id === input.id }
            )}
        >
            <HolderOutlined
                className="holder"
                onMouseDown={handleMouseDown}
                onMouseUp={onMouseUp}
            />
            <InputComponent
                store={store}
                onGrabDrop={() => store.grabbedInput}
                input={input}
            />
            <Button
                size="small"
                type="text"
                icon={<RemoveIcon />}
                onClick={handleDelete}
            />
        </div>
    );
};

const renderInputElement = (
    store: FormbuilderEditorStore,
    input: UIListItem,
    index: number,
    listId: number
) => {
    if (!input?.value) return null;

    const inputsListStore = store.getListById(listId)?.list || [];

    const handleMouseDown = () => {
        const grabbed = elementsData.find(
            (e) => e.storeData.value.type === input.value.type
        );
        if (!grabbed) return;

        store.setSelectedInput(input);
        store.setDragPos(null);
        store.setDragging(true);
        store.setGrabbedIndex(index);
        store.setGrabbedSourceListId(listId);
        store.setGrabbedInput({
            ...input,
            dropCallback: () => {
                const updatedInputs = [
                    ...inputsListStore.slice(0, index),
                    ...inputsListStore.slice(index + 1, inputsListStore.length),
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
            ...inputsListStore.slice(0, index),
            ...inputsListStore.slice(index + 1, inputsListStore.length),
        ];
        store.setListById(listId, updatedInputs);

        if (store.setDirty) store.setDirty(true);
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

        const renderList = [
            ...inputs.flatMap((input, i) => [
                renderDropPlace(store, i, listId, parentId),
                renderInputElement(store, input, i, listId),
            ]),
        ];

        return (
            <>
                {renderList}
                {renderDropPlace(
                    store,
                    renderList.length - 1,
                    listId,
                    parentId
                )}
            </>
        );
    }
);

Mockup.displayName = "Mockup";
