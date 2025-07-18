import type {
    FormbuilderDatetimeItem,
    FormbuilderFormItem,
    FormbuilderTabsItem,
} from "@nextgisweb/formbuilder/type/api";
import dayjs from "@nextgisweb/gui/dayjs";

import type { FormBuilderUIData, UIListItem } from "../type";

export type SerializedResult = Array<FormbuilderTabsItem | FormbuilderFormItem>;

const processDateTimeInitial = (elementData: FormbuilderDatetimeItem) => {
    const value = elementData.initial;

    if (!value) return undefined;

    switch (elementData.datetime) {
        case "date":
            return dayjs(value).format("YYYY-MM-DD");
        case "time":
            return dayjs(value).format("HH:mm:ss");
        case "datetime":
            return dayjs(value).format("YYYY-MM-DDTHH:mm:ss");
    }
};

const getDateTimeParseFormat = (elementData: FormbuilderDatetimeItem) => {
    switch (elementData.datetime) {
        case "date":
            return "YYYY-MM-DD";
        case "time":
            return "HH:mm:ss";
        case "datetime":
            return "YYYY-MM-DDTHH:mm:ss";
    }
};

const convertDateTimeInitialtoUI = (elementData: FormbuilderDatetimeItem) => {
    if (elementData.initial === "CURRENT") return undefined;
    if (!elementData.initial) return undefined;

    return dayjs(elementData.initial, getDateTimeParseFormat(elementData));
};

export function serializeData(
    input: FormBuilderUIData
): Array<FormbuilderTabsItem | FormbuilderFormItem> {
    const output: SerializedResult = [];

    function processList(list: UIListItem[]): FormbuilderFormItem[] {
        return list
            .map((item) => {
                if (item.value.type === "tabs") {
                    return {
                        type: "tabs",
                        tabs: item.value.tabs!.map((tab) => ({
                            title: tab.title,
                            active: tab.active,
                            items: processList(tab.items.list),
                        })),
                    } as unknown as FormbuilderTabsItem; // fix me
                } else if (item.value.type === "datetime") {
                    const processedData = {
                        ...item.data,
                        initial: processDateTimeInitial(item.data),
                    };
                    return {
                        type: item.value.type,
                        ...(processedData || {}),
                    } as FormbuilderFormItem;
                } else {
                    return {
                        type: item.value.type,
                        ...(item.data || {}),
                    } as FormbuilderFormItem;
                }
            })
            .filter((item) => item !== null) as FormbuilderFormItem[];
    }

    const processedList = processList(input.list);
    output.push(...processedList);

    return output;
}

export function convertToUIData(
    items: Array<FormbuilderTabsItem | FormbuilderFormItem>,
    getNewId: () => number
): FormBuilderUIData {
    const processItems = (
        items: Array<FormbuilderTabsItem | FormbuilderFormItem>
    ): UIListItem[] => {
        const result: UIListItem[] = [];

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
                    data: {},
                    id: getNewId(),
                };
            } else if (item.type === "datetime") {
                return {
                    value: {
                        type: item.type,
                        name: item.type,
                        image: item.type,
                    },
                    data: {
                        ...item,
                        initial: convertDateTimeInitialtoUI(item),
                    },
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
        });

        return result;
    };

    return {
        listId: getNewId(),
        list: processItems(items),
    };
}
