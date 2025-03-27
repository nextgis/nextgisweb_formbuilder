import type {
    FormbuilderFormItem,
    FormbuilderTabsItem,
} from "@nextgisweb/formbuilder/type/api";

import type { FormBuilderUIData, UIListItem } from "../type";

export type SerializedResult = Array<FormbuilderTabsItem | FormbuilderFormItem>;

// made by DeepSeek, may be funky
export function serializeData(
    input: FormBuilderUIData
): Array<FormbuilderTabsItem | FormbuilderFormItem> {
    const output: SerializedResult = [];

    function processList(list: UIListItem[]): FormbuilderFormItem[] {
        return list
            .map((item) => {
                // Skip dropPlace items
                if (item.value.type === "dropPlace") {
                    return null;
                }

                // Handle tabs
                if (item.value.type === "tabs") {
                    return {
                        type: "tabs",
                        tabs: item.value.tabs!.map((tab) => ({
                            title: tab.title,
                            active: tab.active,
                            items: processList(tab.items.list),
                        })),
                    } as unknown as FormbuilderTabsItem; // fix me
                }

                // Handle all other types dynamically
                return {
                    type: item.value.type, // Use the type from the input
                    // attributes: item.data || {}, // Use the data as attributes
                    ...(item.data || {}), // Use the data as attributes
                } as FormbuilderFormItem;
            })
            .filter((item) => item !== null) as FormbuilderFormItem[]; // Filter out null items (dropPlace)
    }

    const processedList = processList(input.list);
    output.push(...processedList);

    return output;
}

const createDropPlace = (): UIListItem => ({
    value: { type: "dropPlace" },
    data: null,
});

export function convertToUIData(
    items: Array<FormbuilderTabsItem | FormbuilderFormItem>,
    getNewId: () => number
): FormBuilderUIData {
    const processItems = (
        items: Array<FormbuilderTabsItem | FormbuilderFormItem>
    ): UIListItem[] => {
        const result: UIListItem[] = [createDropPlace()];

        const convertItem = (
            item: FormbuilderTabsItem | FormbuilderFormItem
        ): UIListItem => {
            if (item.type === "tabs") {
                return {
                    value: {
                        type: "tabs",
                        name: "tabs",
                        image: "tabs",
                        tabs: item.tabs!.map((tab) => ({
                            title: tab.title,
                            active: tab.active,
                            items: {
                                listId: getNewId(),
                                list: processItems(tab.items),
                            },
                        })),
                    },
                    data: { currentPage: 0 },
                    id: getNewId(),
                };
            } else {
                // wrong temp delirium - PROLLY FIXED
                return {
                    value: {
                        type: item.type,
                        name: item.type,
                        image: item.type,
                    },
                    data: {
                        ...item,
                    },
                    id: getNewId(),
                };
            }
        };

        items.forEach((item) => {
            result.push(convertItem(item));
            result.push(createDropPlace());
        });

        return result;
    };

    return {
        listId: getNewId(),
        list: processItems(items),
    };
}
