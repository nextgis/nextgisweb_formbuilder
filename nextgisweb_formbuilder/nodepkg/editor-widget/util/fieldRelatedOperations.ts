import { allFieldProps } from "../element";
import type { FormBuilderUIData } from "../type";

export function isFieldOccupied(
    keyname: string,
    inputsTree: FormBuilderUIData
) {
    const isFieldOccupiedInner = (tree: any, keyname: string): boolean => {
        if (allFieldProps.some((prop) => tree?.data?.[prop] === keyname)) {
            return true;
        }

        if (tree.list && Array.isArray(tree.list)) {
            for (const item of tree.list) {
                if (isFieldOccupiedInner(item, keyname)) {
                    return true;
                }
            }
        }

        if (tree.value && tree.value.tabs && Array.isArray(tree.value.tabs)) {
            for (const tab of tree.value.tabs) {
                if (tab.items && isFieldOccupiedInner(tab.items, keyname)) {
                    return true;
                }
            }
        }

        return false;
    };

    return isFieldOccupiedInner(inputsTree, keyname);
}

// kinda unsafe with o value and boolean/number logic
export function getElementIdByField(
    keyname: string,
    inputsTree: FormBuilderUIData
): number {
    const getElementIdByFieldInner = (tree: any, keyname: string): number => {
        if (allFieldProps.some((prop) => tree?.data?.[prop] === keyname)) {
            return tree.id;
        }

        if (tree.list && Array.isArray(tree.list)) {
            for (const item of tree.list) {
                if (getElementIdByFieldInner(item, keyname) >= 0) {
                    return item.id;
                }
            }
        }

        if (tree.value && tree.value.tabs && Array.isArray(tree.value.tabs)) {
            for (const tab of tree.value.tabs) {
                if (
                    tab.items &&
                    getElementIdByFieldInner(tab.items, keyname) >= 0
                ) {
                    return tree.id;
                }
            }
        }

        return -1;
    };

    return getElementIdByFieldInner(inputsTree, keyname);
}
