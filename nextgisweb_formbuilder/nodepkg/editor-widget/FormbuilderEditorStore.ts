import { action, observable } from "mobx";

import type { FeaureLayerGeometryType } from "@nextgisweb/feature-layer/type/api";
import type { FormbuilderField } from "@nextgisweb/formbuilder/type/api";

import type {
    DragPos,
    FormBuilderUIData,
    GrabbedInputComposite,
    UIListItem,
    UITab,
} from "./type";
import { updateElementById } from "./util/updateElementById";

export interface FormbuilderEditorField extends FormbuilderField {
    existing: boolean;
}

export interface FormbuilderValue {
    fields: FormbuilderEditorField[];
    tree: FormBuilderUIData;
    updateFeatureLayerFields: boolean;
    geometryType: FeaureLayerGeometryType;
}

export class FormbuilderEditorStore {
    @observable accessor file_upload = null;
    @observable.ref accessor uploading = false;
    @observable.shallow accessor inputsTree: FormBuilderUIData = {
        listId: 0,
        list: [{ value: { type: "dropPlace" }, data: null }],
    };
    @observable.ref accessor geometryType: FeaureLayerGeometryType = "POINT";
    @observable.shallow accessor fields: FormbuilderEditorField[] = [];
    @observable.ref accessor canUpdateFields: boolean = false;
    @observable.ref accessor updateFeatureLayerFields: boolean = false;

    @observable.shallow accessor grabbedInput: GrabbedInputComposite | null =
        null;
    @observable.ref accessor grabbedIndex: number | null = null;
    @observable.ref accessor grabbedSourceListId: number | null = null;
    @observable.ref accessor isMoving: boolean = false;
    @observable.ref accessor listCounter: number = 0;
    @observable.ref accessor selectedInput: UIListItem | null = null;
    @observable.ref accessor dragPos: DragPos | null = null;
    @observable.ref accessor dragging = false;

    @observable.ref accessor onChange:
        | ((val: FormbuilderValue) => void)
        | null = null;

    constructor({
        onChange,
    }: {
        onChange?: (val: FormbuilderValue) => void;
    } = {}) {
        this.onChange = onChange ?? null;
    }

    @action.bound
    setDragPos(dragPos: DragPos | null) {
        this.dragPos = dragPos;
    }

    @action.bound
    setDragging(dragging: boolean) {
        this.dragging = dragging;
    }

    @action.bound
    setInputsTree = (inputs: FormBuilderUIData) => {
        this.inputsTree = inputs;
        this.onChange?.({
            tree: inputs,
            fields: this.fields,
            updateFeatureLayerFields: this.updateFeatureLayerFields,
            geometryType: this.geometryType,
        });
    };

    @action.bound
    setIsMoving(value: boolean) {
        this.isMoving = value;
    }

    @action.bound
    setSelectedInput(value: UIListItem | null) {
        this.selectedInput = value;
    }

    @action.bound
    setGrabbedInput(composite: GrabbedInputComposite | null) {
        this.grabbedInput = composite;
    }

    @action.bound
    setGrabbedIndex(i: number | null) {
        this.grabbedIndex = i;
    }

    @action.bound
    setGrabbedSourceListId(id: number | null) {
        this.grabbedSourceListId = id;
    }

    @action.bound
    getNewListIndex() {
        this.listCounter += 1;
        return this.listCounter;
    }

    @action.bound
    setFields(fields: FormbuilderEditorField[]) {
        this.fields = fields;
        this.onChange?.({
            fields,
            tree: this.inputsTree,
            updateFeatureLayerFields: this.updateFeatureLayerFields,
            geometryType: this.geometryType,
        });
    }

    @action.bound
    setCanUpdateFields(value: boolean) {
        this.canUpdateFields = value;
    }

    @action.bound
    setUpdateFeatureLayerFields(value: boolean) {
        this.updateFeatureLayerFields = value;
        this.onChange?.({
            tree: this.inputsTree,
            fields: this.fields,
            updateFeatureLayerFields: value,
            geometryType: this.geometryType,
        });
    }

    @action.bound
    setGeometryType(value: FeaureLayerGeometryType) {
        this.geometryType = value;
    }

    @action.bound
    updateField(keyname: string, newData: Partial<FormbuilderEditorField>) {
        const updatedFields = this.fields.map((field) => {
            if (field.keyname === keyname) {
                return { ...field, ...newData };
            } else {
                return field;
            }
        });

        this.fields = updatedFields;

        this.onChange?.({
            fields: updatedFields,
            tree: this.inputsTree,
            updateFeatureLayerFields: this.updateFeatureLayerFields,
            geometryType: this.geometryType,
        });
    }

    getElementById(id: number) {
        function findElementById(
            data: FormBuilderUIData | UIListItem | UITab,
            targetId: number
        ): UIListItem | null {
            if ("id" in data && data.id === targetId) {
                return data as UIListItem;
            }

            if ("list" in data) {
                for (const item of data.list) {
                    const result = findElementById(item, targetId);
                    if (result) {
                        return result;
                    }
                }
            }

            if (
                (data as UIListItem)?.value &&
                Object.keys((data as UIListItem)?.value).includes("tabs")
            ) {
                const tabs = (data as UIListItem)?.value.tabs;
                if (tabs) {
                    for (const tab of tabs) {
                        const result = findElementById(tab.items, targetId);
                        if (result) {
                            return result;
                        }
                    }
                }
            }

            return null;
        }

        const res = findElementById(this.inputsTree, id);
        return res;
    }

    getListById(id: number) {
        function findListByIdInner(
            data: FormBuilderUIData,
            listId: number
        ): FormBuilderUIData | null {
            if (data.listId === listId) {
                return data;
            }

            for (const item of data.list) {
                if (item.value && item.value.tabs) {
                    for (const tab of item.value.tabs) {
                        if (tab.items) {
                            const result = findListByIdInner(tab.items, listId);
                            if (result) {
                                return result;
                            }
                        }
                    }
                }
            }

            return null;
        }

        const res = findListByIdInner(this.inputsTree, id);
        return res;
    }

    isNestedWithin(firstId: number, secondId: number): boolean {
        const firstElement = this.getElementById(firstId);
        if (!firstElement) {
            return false;
        }

        const secondElement = this.getElementById(secondId);
        if (!secondElement) {
            return false;
        }

        function isSecondIdNestedInFirst(
            element: any,
            targetId: number
        ): boolean {
            if (element.id === targetId) {
                return true;
            }

            if (element.value && element.value.type === "tabs") {
                for (const tab of element.value.tabs) {
                    if (
                        tab.items &&
                        isSecondIdNestedInFirst(tab.items, targetId)
                    ) {
                        return true;
                    }
                }
            }

            if (element.list) {
                for (const item of element.list) {
                    if (isSecondIdNestedInFirst(item, targetId)) {
                        return true;
                    }
                }
            }

            return false;
        }

        if (firstElement.value && firstElement.value.type === "tabs") {
            if (isSecondIdNestedInFirst(firstElement, secondId)) {
                return true;
            }
        }

        return false;
    }

    @action
    setListById(id: number, newList: UIListItem[]) {
        function setListByIdInner(
            data: FormBuilderUIData | UIListItem | UITab,
            targetListId: number,
            newList: UIListItem[]
        ): boolean {
            if (
                Object.keys(data).includes("listId") &&
                (data as FormBuilderUIData).listId === targetListId
            ) {
                (data as FormBuilderUIData).list = newList;
                return true;
            }

            if (
                Object.keys(data).includes("list") &&
                (data as FormBuilderUIData).list
            ) {
                for (const item of (data as FormBuilderUIData).list) {
                    if (setListByIdInner(item, targetListId, newList)) {
                        return true;
                    }
                }
            }

            if (
                (data as UIListItem).value &&
                Object.keys((data as UIListItem).value).includes("tabs")
            ) {
                const tabs = (data as UIListItem).value.tabs;

                if (tabs) {
                    for (const tab of tabs) {
                        if (
                            setListByIdInner(tab.items, targetListId, newList)
                        ) {
                            return true;
                        }
                    }
                }
            }

            return false;
        }

        setListByIdInner(this.inputsTree, id, newList);
    }

    setNewElementData(id: number, newData: any) {
        const newInputsTree = updateElementById(
            this.inputsTree,
            id,
            (element) => {
                element.data = newData;
            }
        );

        this.setInputsTree(newInputsTree);
    }

    setNewElementValue(id: number, newValue: any) {
        const newInputsTree = updateElementById(
            this.inputsTree,
            id,
            (element) => {
                element.value = newValue;
            }
        );

        this.setInputsTree(newInputsTree);
    }
}
