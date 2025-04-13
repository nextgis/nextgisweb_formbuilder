import { gettext, gettextf } from "@nextgisweb/pyramid/i18n";

import type { FormbuilderEditorStore } from "./FormbuilderEditorStore";
import type { GrabbedInputComposite } from "./type";

export type FormElementData = {
    value: { name: string; type: string };
    data: any;
};

const msgDefaultText = gettext("Text");

export const elements: FormElementData[] = [
    {
        value: {
            name: gettext("Label"),
            type: "label",
        },
        data: {
            text: msgDefaultText,
        },
    },
    {
        value: {
            name: gettext("Tabs"),
            type: "tabs",
        },
        data: null,
    },
    {
        value: {
            type: "textbox",
            name: gettext("Text box"),
        },
        data: {
            field: "",
            remember: false,
        },
    },
    {
        value: {
            name: gettext("Check box"),
            type: "checkbox",
        },
        data: {
            field: "",
            remember: true,
            label: msgDefaultText,
        },
    },
];

export const inputsSchema = {
    label: {
        label: "string",
    },
    tabs: {
        currentPage: "number",
    },
    textbox: {
        field: "string",
        remember: "boolean",
    },
    checkbox: {
        field: "string",
        remember: "boolean",
        label: "string",
    },
};

const nonFieldTypes = elements
    .filter((element) => element.data?.field === undefined)
    .map((element) => element.value.type);

export const isNonFieldElement = (input: GrabbedInputComposite | null) => {
    if (!input) {
        return true;
    }

    return nonFieldTypes.includes(input?.value.type);
};

export const getNewTabsElement = (store: FormbuilderEditorStore) => {
    return {
        data: {},
        value: {
            name: gettext("Tabs"),
            type: "tabs",
            tabs: [
                {
                    title: gettextf("Tab {}")(1),
                    active: true,
                    items: {
                        listId: store.getNewListIndex(),
                        list: [
                            {
                                value: {
                                    type: "dropPlace",
                                },
                                data: null,
                            },
                        ],
                    },
                },
                {
                    title: gettextf("Tab {}")(2),
                    active: false,
                    items: {
                        listId: store.getNewListIndex(),
                        list: [
                            {
                                value: {
                                    type: "dropPlace",
                                },
                                data: null,
                            },
                        ],
                    },
                },
            ],
        },
    };
};
