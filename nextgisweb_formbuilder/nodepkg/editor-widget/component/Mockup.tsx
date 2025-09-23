import { Button, Modal } from "antd";
import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useState } from "react";

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

import { DropPlace } from "./DropPlace";
import { FieldPropertiesModalConent } from "./FieldPropertiesModalConent";

import { HolderOutlined } from "@ant-design/icons";

const msgDataBinging = gettext("Data binding");

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
    store.setIsMoving(false);
    store.setDragging(false);
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

// To Do: make options object as argument
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

// To Do: make options object as argument
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

// To Do: make options object as argument
const handleExistingPositionDrop = (
    store: FormbuilderEditorStore,
    listId: number,
    dropIndex: number,
    grabbedIndex: number,
    droppingInput: GrabbedInputComposite | null
) => {
    if (!droppingInput || [0, 1].includes(dropIndex - grabbedIndex)) {
        resetGrabState(store);
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

// To Do: make options object as argument
const handleDropLogic = (
    store: FormbuilderEditorStore,
    listId: number,
    dropIndex?: number
) => {
    const { grabbedInput, grabbedSourceListId, grabbedIndex, isMoving } = store;

    if (!grabbedInput || dropIndex === undefined) return;

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

    if (!grabbedInput) {
        resetGrabState(store);
        return;
    }

    if (listId !== grabbedSourceListId) {
        handleDrop(store, listId, dropIndex, grabbedInput);

        // setting new input as selected
        if (!isMoving) store.setSelectedInput(grabbedInput);
        return;
    }

    if (grabbedIndex === null) {
        handleDrop(store, listId, dropIndex, grabbedInput);
    } else {
        handleExistingPositionDrop(
            store,
            listId,
            dropIndex,
            grabbedIndex,
            grabbedInput
        );
    }
};

// Render functions

// To Do: make options object as argument
const renderDropPlace = (
    store: FormbuilderEditorStore,
    index: number,
    listId: number,
    setFieldsModalOpen: (val: boolean) => void,
    setDropIndex: (val: number) => void,
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

        // Create modal to setup fields of new dropping component
        if (!store.isMoving && !isNonFieldElement(store.grabbedInput)) {
            setFieldsModalOpen(true);
            setDropIndex(index);
            // first add element data to some modal related store or props
            // then reset drag and drop stuff
        } else {
            handleDropLogic(store, listId, index);
        }
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

        const [isModalOpen, setIsModalOpen] = useState(false);
        const [modalDataElementType, setModalDataElementType] =
            useState<string>();

        const [modalDataFieldsReady, setModalDataFieldsReady] = useState(false);

        const [pendingNewFields, setPendingNewFields] = useState<
            FormbuilderEditorField[]
        >([]);

        const handleSetPendingFields = (newField: FormbuilderEditorField) => {
            setPendingNewFields([...pendingNewFields, newField]);
        };

        const handleSetFieldsInModal = (fields: Record<string, string>) => {
            if (store.grabbedInput) {
                const updatedGrabbedInput = {
                    ...store.grabbedInput,
                    value: store.grabbedInput.value,
                    data: { ...store.grabbedInput?.data, ...fields },
                };

                store.setGrabbedInput(updatedGrabbedInput);

                setModalDataFieldsReady(true);
            }
        };

        const [dropIndex, setDropIndex] = useState<number>();

        const { list: inputs, listId } = inputsWithId;

        const renderList = [
            ...inputs.flatMap((input, i) => [
                renderDropPlace(
                    store,
                    i,
                    listId,
                    setIsModalOpen,
                    setDropIndex,
                    parentId
                ),
                renderInputElement(store, input, i, listId),
            ]),
        ];

        const filterPendingFieldsOnUsage = (
            pendinNewFields: FormbuilderEditorField[]
        ) => {
            const grabbedInputSchema =
                elementsData.find(
                    (el) => el.elementId === store.grabbedInput?.value.type
                )?.schema || {};

            const fieldsProps = Object.entries(grabbedInputSchema)
                .filter(([_key, value]) => value.type === "field")
                .map(([key]) => key);

            const filteredPendingFields = pendinNewFields.filter(
                ({ keyname }) => {
                    const grabbedFieldValues = Object.entries(
                        store.grabbedInput?.data
                    )
                        .filter(([key]) => fieldsProps.includes(key))
                        .map(([_key, value]) => value);

                    return grabbedFieldValues.includes(keyname);
                }
            );

            return filteredPendingFields;
        };

        return (
            <>
                {renderList}
                {renderDropPlace(
                    store,
                    renderList.length - 1,
                    listId,
                    setIsModalOpen,
                    setDropIndex,
                    parentId
                )}
                <Modal
                    open={isModalOpen}
                    destroyOnHidden={true}
                    title={msgDataBinging}
                    afterOpenChange={() => {
                        setModalDataElementType(
                            store?.grabbedInput?.value.type
                        );
                        store.setDragging(false);
                    }}
                    okButtonProps={{ disabled: !modalDataFieldsReady }}
                    onOk={() => {
                        setIsModalOpen(false);

                        const filteredPendingFields =
                            filterPendingFieldsOnUsage(pendingNewFields);

                        store.setFields([
                            ...store.fields,
                            ...filteredPendingFields,
                        ]);

                        handleDropLogic(store, listId, dropIndex);
                        resetGrabState(store);
                        setModalDataFieldsReady(false);
                        setPendingNewFields([]);
                    }}
                    onCancel={() => {
                        setIsModalOpen(false);
                        resetGrabState(store);
                        setModalDataFieldsReady(false);
                        setPendingNewFields([]);
                    }}
                >
                    {modalDataElementType && (
                        <FieldPropertiesModalConent
                            store={store}
                            type={modalDataElementType}
                            setFieldsForInput={handleSetFieldsInModal}
                            dispatchPendingNewField={handleSetPendingFields}
                        />
                    )}
                </Modal>
            </>
        );
    }
);

Mockup.displayName = "Mockup";
