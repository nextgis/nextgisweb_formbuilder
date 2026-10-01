import { cloneDeep } from "lodash-es";
import { actionBound, observableRef, observableShallow } from "mobx";

import type { FeatureLayerGeometryType } from "@nextgisweb/feature-layer/type/api";
import type { FormbuilderField } from "@nextgisweb/formbuilder/type/api";
import { assert } from "@nextgisweb/jsrealm/error";
import type {
  CompositeRead,
  EffectivePermissions,
} from "@nextgisweb/resource/type/api";

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
  geometryType: FeatureLayerGeometryType;
}

export class FormbuilderEditorStore {
  @observableShallow accessor inputsTree: FormBuilderUIData = {
    listId: 0,
    list: [],
  };
  @observableRef accessor geometryType: FeatureLayerGeometryType = "POINT";
  @observableShallow accessor fields: FormbuilderEditorField[] = [];
  @observableRef accessor canUpdateFields: boolean = false;
  @observableRef accessor updateFeatureLayerFields: boolean = false;

  @observableShallow accessor grabbedInput: GrabbedInputComposite | null = null;
  @observableRef accessor grabbedIndex: number | null = null;
  @observableRef accessor grabbedSourceListId: number | null = null;
  @observableRef accessor isMoving: boolean = false;
  @observableRef accessor listCounter: number = 0;
  @observableRef accessor selectedInput: UIListItem | null = null;
  @observableRef accessor dragging = false;
  @observableRef accessor dragPos: DragPos | null = null;

  @observableRef accessor onChange: ((val: FormbuilderValue) => void) | null =
    null;
  @observableRef accessor setDirty: ((val: boolean) => void) | null;

  @observableRef accessor editable: boolean = true;

  constructor({
    onChange,
    setDirty,
    editable = true,
  }: {
    onChange?: (val: FormbuilderValue) => void;
    setDirty?: (val: boolean) => void;
    editable?: boolean;
  } = {}) {
    this.onChange = onChange ?? null;
    this.setDirty = setDirty ?? null;
    this.editable = editable;
  }

  @actionBound
  setEditable(value: boolean) {
    this.editable = value;
  }

  @actionBound
  setDragging(value: boolean) {
    if (this.dragging === value) return;
    this.dragging = value;
    this.dragPos = null;
  }

  @actionBound
  setDragPos(value: DragPos) {
    this.dragPos = value;
  }

  @actionBound
  setInputsTree(inputs: FormBuilderUIData) {
    this.inputsTree = inputs;
    this.onChange?.({
      tree: inputs,
      fields: this.fields,
      updateFeatureLayerFields: this.updateFeatureLayerFields,
      geometryType: this.geometryType,
    });
  }

  @actionBound
  setIsMoving(value: boolean) {
    this.isMoving = value;
  }

  @actionBound
  setSelectedInput(value: UIListItem | null) {
    this.selectedInput = value;
  }

  @actionBound
  setGrabbedInput(composite: GrabbedInputComposite | null) {
    this.grabbedInput = composite;
  }

  @actionBound
  setGrabbedIndex(i: number | null) {
    this.grabbedIndex = i;
  }

  @actionBound
  setGrabbedSourceListId(id: number | null) {
    this.grabbedSourceListId = id;
  }

  @actionBound
  getNewListIndex() {
    this.listCounter += 1;
    return this.listCounter;
  }

  @actionBound
  setFeatureLayer(composite: CompositeRead, permissions: EffectivePermissions) {
    const { resource, feature_layer: featureLayer } = composite;
    const hasIFE = resource.interfaces.includes("IFieldEditableFeatureLayer");
    assert(featureLayer, "Parent resource must be a feature layer");
    const existing: FormbuilderEditorField[] = featureLayer.fields.map(
      ({ keyname, display_name, datatype }) => ({
        keyname,
        display_name,
        datatype,
        existing: true,
      })
    );

    const absent = this.fields.filter((field) => {
      return !existing.find((item) => item.keyname === field.keyname);
    });

    this.geometryType = featureLayer.geometry_type;
    this.canUpdateFields = hasIFE && permissions.resource.update;
    this.updateFeatureLayerFields = this.canUpdateFields && absent.length === 0;
    this.setFields([...existing, ...absent]); // Will fire onChange event
  }

  @actionBound
  setFields(fields: FormbuilderEditorField[]) {
    this.fields = fields;
    this.fireOnChange();
  }

  @actionBound
  setUpdateFeatureLayerFields(value: boolean) {
    this.updateFeatureLayerFields = value;
    this.fireOnChange();
  }

  @actionBound
  updateField(keyname: string, newData: Partial<FormbuilderEditorField>) {
    this.fields = this.fields.map((field) => {
      if (field.keyname === keyname) {
        return { ...field, ...newData };
      } else {
        return field;
      }
    });
    this.fireOnChange();
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

    function isSecondIdNestedInFirst(element: any, targetId: number): boolean {
      if (element.id === targetId) {
        return true;
      }

      if (element.value && element.value.type === "tabs") {
        for (const tab of element.value.tabs) {
          if (tab.items && isSecondIdNestedInFirst(tab.items, targetId)) {
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

  @actionBound
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
            if (setListByIdInner(tab.items, targetListId, newList)) {
              return true;
            }
          }
        }
      }

      return false;
    }

    const treeDeepClone = cloneDeep(this.inputsTree);
    setListByIdInner(treeDeepClone, id, newList);

    this.inputsTree = treeDeepClone;
    this.fireOnChange();
  }

  @actionBound
  setNewElementData(id: number, newData: any) {
    this.inputsTree = updateElementById(this.inputsTree, id, (element) => {
      element.data = newData;
    });
    this.fireOnChange();
  }

  @actionBound
  setNewElementValue(id: number, newValue: any) {
    this.inputsTree = updateElementById(this.inputsTree, id, (element) => {
      element.value = newValue;
    });
    this.fireOnChange();
  }

  private fireOnChange() {
    this.onChange?.({
      tree: this.inputsTree,
      fields: this.fields,
      updateFeatureLayerFields: this.updateFeatureLayerFields,
      geometryType: this.geometryType,
    });
  }
}
