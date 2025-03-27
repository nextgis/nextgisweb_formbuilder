import { traverseTree } from "@nextgisweb/gui/util/tree";

import type { FormBuilderUIData, UIListItem } from "../type";

import { formBuilderRelation } from "./formBuilderRelation";

export function updateElementById(
    tree: FormBuilderUIData,
    id: number,
    updater: (item: UIListItem) => void
) {
    const clonedTree: FormBuilderUIData = {
        ...tree,
        list: [...tree.list],
    };
    traverseTree(
        clonedTree.list,
        (item) => {
            if (item.id === id) {
                updater(item);
                return true;
            }
        },
        formBuilderRelation
    );
    return clonedTree;
}
