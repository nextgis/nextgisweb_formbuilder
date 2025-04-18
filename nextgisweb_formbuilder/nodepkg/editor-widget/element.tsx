import CheckboxIcon from "@nextgisweb/formbuilder/editor-widget/icon/checkbox.svg";
import LabelIcon from "@nextgisweb/formbuilder/editor-widget/icon/label.svg";
import TabsIcon from "@nextgisweb/formbuilder/editor-widget/icon/tabs.svg";
import TextboxIcon from "@nextgisweb/formbuilder/editor-widget/icon/textbox.svg";
import { Checkbox, Input } from "@nextgisweb/gui/antd";
import { gettext, gettextf } from "@nextgisweb/pyramid/i18n";

import type { FormbuilderEditorStore } from "./FormbuilderEditorStore";
import { TabsFormComponent } from "./component/TabsFormComponent";
import type { GrabbedInputComposite, UIListItem } from "./type";

export type FormElementData = {
    value: { name: string; type: string };
    data: any;
};

interface ElementWrapperProps {
    input: UIListItem;
    store: FormbuilderEditorStore;
    onGrabDrop: () => GrabbedInputComposite | null;
}

export const elementsData = [
    {
        elementId: "label",
        icon: <LabelIcon />,
        schema: {
            label: {
                type: "string",
                formLabel: gettext("Label"),
            },
        },
        storeData: {
            value: {
                name: gettext("Label"),
                type: "label",
            },
            data: {
                label: gettext("Text"),
            },
        },
        render: ({ input, store }: ElementWrapperProps) => {
            return (
                <div
                    className="ngw-formbuilder-editor-widget-element"
                    onClick={(e) => {
                        e.stopPropagation();
                        store.setSelectedInput(input);
                    }}
                >
                    {input?.data?.label ?? <>&nbsp;</>}
                </div>
            );
        },
    },
    {
        elementId: "tabs",
        icon: <TabsIcon />,
        schema: {},
        storeData: {
            value: {
                name: gettext("Tabs"),
                type: "tabs",
            },
            data: {},
        },
        render: ({ input, onGrabDrop, store }: ElementWrapperProps) => {
            return (
                <div
                    className="ngw-formbuilder-editor-widget-element"
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                >
                    <TabsFormComponent
                        store={store}
                        value={input}
                        onGrabDrop={onGrabDrop}
                    />
                </div>
            );
        },
    },
    {
        elementId: "textbox",
        icon: <TextboxIcon />,
        schema: {
            field: { type: "string", formLabel: gettext("Field") },
            remember: {
                type: "boolean",
                formLabel: gettext("Remember last value"),
            },
            max_lines: {
                type: "number",
                formLabel: gettext("Max. lines"),
            },
            numbers_only: {
                type: "boolean",
                formLabel: gettext("Numbers only"),
            },
        },
        storeData: {
            value: {
                type: "textbox",
                name: gettext("Text box"),
            },
            data: {
                field: "",
                remember: false,
                max_lines: 1,
                numbers_only: false,
            },
        },
        render: ({ store, input }: ElementWrapperProps) => {
            return (
                <div
                    className="ngw-formbuilder-editor-widget-element"
                    onClick={(e) => {
                        e.stopPropagation();
                        store.setSelectedInput(input);
                    }}
                >
                    <Input
                        size="small"
                        variant="borderless"
                        style={{ padding: 0 }}
                        value={""}
                    />
                </div>
            );
        },
    },
    {
        elementId: "checkbox",
        icon: <CheckboxIcon />,
        schema: {
            field: {
                type: "string",
                formLabel: gettext("Field"),
            },
            remember: {
                type: "boolean",
                formLabel: gettext("Remember last value"),
            },
            initial: {
                type: "boolean",
                formLabel: gettext("Initial value"),
            },
            label: {
                type: "string",
                formLabel: gettext("Label"),
            },
        },
        storeData: {
            value: {
                name: gettext("Check box"),
                type: "checkbox",
            },
            data: {
                field: "",
                remember: false,
                initial: false,
                label: gettext("Text"),
            },
        },
        render: ({ input, store }: ElementWrapperProps) => {
            return (
                <div
                    className="ngw-formbuilder-editor-widget-element"
                    onClick={(e) => {
                        e.stopPropagation();
                        store.setSelectedInput(input);
                    }}
                >
                    <Checkbox
                        style={{ pointerEvents: "none" }}
                        checked={input.data?.initial}
                    >
                        {input?.data?.label}
                    </Checkbox>
                </div>
            );
        },
    },
];

const nonFieldTypes = elementsData
    .filter((element) => element.storeData.data?.field === undefined)
    .map((element) => element.storeData.value.type);

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
                        list: [],
                    },
                },
                {
                    title: gettextf("Tab {}")(2),
                    active: false,
                    items: {
                        listId: store.getNewListIndex(),
                        list: [],
                    },
                },
            ],
        },
    };
};
