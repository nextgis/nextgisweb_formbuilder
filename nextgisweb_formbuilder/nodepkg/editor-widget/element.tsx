import AverageIcon from "@nextgisweb/formbuilder/editor-widget/icon/average.svg";
import CascadeIcon from "@nextgisweb/formbuilder/editor-widget/icon/cascade.svg";
import CheckboxIcon from "@nextgisweb/formbuilder/editor-widget/icon/checkbox.svg";
import CoordsIcon from "@nextgisweb/formbuilder/editor-widget/icon/coords.svg";
import DateTimeIcon from "@nextgisweb/formbuilder/editor-widget/icon/date_time.svg";
import DistanceIcon from "@nextgisweb/formbuilder/editor-widget/icon/distance.svg";
import DropDownIcon from "@nextgisweb/formbuilder/editor-widget/icon/dropdown.svg";
import DualDropDownIcon from "@nextgisweb/formbuilder/editor-widget/icon/dropdown_dual.svg";
import LabelIcon from "@nextgisweb/formbuilder/editor-widget/icon/label.svg";
import PhotoIcon from "@nextgisweb/formbuilder/editor-widget/icon/photo.svg";
import RadioIcon from "@nextgisweb/formbuilder/editor-widget/icon/radio.svg";
import SpacerIcon from "@nextgisweb/formbuilder/editor-widget/icon/spacer.svg";
import TabsIcon from "@nextgisweb/formbuilder/editor-widget/icon/tabs.svg";
import TextboxIcon from "@nextgisweb/formbuilder/editor-widget/icon/textbox.svg";
import type {
    FormbuilderAverageItem,
    FormbuilderCascadeItem,
    FormbuilderCheckboxItem,
    FormbuilderCoordinatesItem,
    FormbuilderDatetimeItem,
    FormbuilderDistanceItem,
    FormbuilderDropdownDualItem,
    FormbuilderDropdownItem,
    FormbuilderLabelItem,
    FormbuilderPhotoItem,
    FormbuilderRadioItem,
    FormbuilderSystemItem,
    FormbuilderTextboxItem,
    OptionSingle,
} from "@nextgisweb/formbuilder/type/api";
import { Button, Checkbox, Input, Radio } from "@nextgisweb/gui/antd";
import type { InputProps } from "@nextgisweb/gui/antd";
import { gettext, gettextf } from "@nextgisweb/pyramid/i18n";

import type { FormbuilderEditorStore } from "./FormbuilderEditorStore";
import type { OptionsRow } from "./component/SimpleTableStores";
import { TabsFormComponent } from "./component/TabsFormComponent";
import {
    OptionsInputInitialValue,
    OptionsInputValueStringProp,
    OptionsInputValueValue,
} from "./component/valueInputs";
import type { GrabbedInputComposite, UIListItem } from "./type";

const msgDatetimePlaceholder: {
    [V in FormbuilderDatetimeItem["datetime"]]: string;
} = {
    date: gettext("Current date"),
    time: gettext("Current time"),
    datetime: gettext("Current date & time"),
};

const systemItemTypes: [FormbuilderSystemItem["system"], string][] = [
    ["ngid_username", gettext("NextGIS ID username")],
    ["ngw_username", gettext("NextGIS Web username")],
];

export type FormElementData = {
    value: { name: string; type: string };
    data: any;
};

interface StubProps
    extends Pick<InputProps, "style" | "placeholder" | "suffix"> {}

function Stub({ style, ...props }: StubProps) {
    return (
        <Input
            size="small"
            variant="borderless"
            style={{ padding: 0, pointerEvents: "none", ...(style ?? {}) }}
            value={""}
            {...props}
        />
    );
}

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
            } satisfies Omit<FormbuilderLabelItem, "type">,
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
        elementId: "spacer",
        icon: <SpacerIcon />,
        schema: {},
        storeData: {
            value: {
                name: gettext("Spacer"),
                type: "spacer",
            },
            data: {},
        },
        render: ({ input, store }: ElementWrapperProps) => {
            return (
                <div
                    className="ngw-formbuilder-editor-widget-element"
                    onClick={(e) => {
                        e.stopPropagation();
                        store.setSelectedInput(input);
                    }}
                />
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
            field: {
                type: "field",
                formLabel: gettext("Field"),
            },
            max_lines: {
                type: "number",
                formLabel: gettext("Max. lines"),
                min: 1,
            },
            numbers_only: {
                type: "boolean",
                formLabel: gettext("Numbers only"),
            },
            remember: {
                type: "boolean",
                formLabel: gettext("Remember last value"),
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
            } satisfies Omit<FormbuilderTextboxItem, "type">,
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
                    <Stub />
                </div>
            );
        },
    },
    {
        elementId: "checkbox",
        icon: <CheckboxIcon />,
        schema: {
            label: {
                type: "string",
                formLabel: gettext("Label"),
            },
            field: {
                type: "field",
                formLabel: gettext("Field"),
            },
            initial: {
                type: "boolean",
                formLabel: gettext("Initial value"),
            },
            remember: {
                type: "boolean",
                formLabel: gettext("Remember last value"),
            },
        },
        storeData: {
            value: {
                name: gettext("Check box"),
                type: "checkbox",
            },
            data: {
                label: gettext("Text"),
                field: "",
                initial: false,
                remember: false,
            } satisfies Omit<FormbuilderCheckboxItem, "type">,
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
    {
        elementId: "datetime",
        icon: <DateTimeIcon />,
        schema: {
            field: {
                type: "field",
                formLabel: gettext("Field"),
            },
            datetime: {
                type: "select",
                formLabel: gettext("Type"),
                selectOptions: [
                    { value: "date", label: gettext("Date") },
                    { value: "time", label: gettext("Time") },
                    { value: "datetime", label: gettext("Date & time") },
                ],
            },
            initial: {
                type: "datetime",
                formLabel: gettext("Initial value"),
            },
            remember: {
                type: "boolean",
                formLabel: gettext("Remember last value"),
            },
        },
        storeData: {
            value: {
                name: gettext("Date & time"),
                type: "datetime",
            },
            data: {
                field: "",
                datetime: "date",
                initial: undefined,
                remember: false,
            } satisfies Omit<FormbuilderDatetimeItem, "type">,
        },
        render: ({ input, store }: ElementWrapperProps) => {
            type Datetime = FormbuilderDatetimeItem["datetime"];
            const datetime = input.data?.datetime as Datetime;
            return (
                <div
                    className="ngw-formbuilder-editor-widget-element"
                    onClick={(e) => {
                        e.stopPropagation();
                        store.setSelectedInput(input);
                    }}
                >
                    <Stub placeholder={msgDatetimePlaceholder[datetime]} />
                </div>
            );
        },
    },
    {
        elementId: "coordinates",
        icon: <CoordsIcon />,
        schema: {
            field_lon: {
                type: "field",
                formLabel: gettext("Longitude field"),
            },
            field_lat: {
                type: "field",
                formLabel: gettext("Lattitude field"),
            },
            hidden: {
                type: "boolean",
                formLabel: gettext("Hide"),
            },
        },
        storeData: {
            value: {
                name: gettext("Coordinates"),
                type: "coordinates",
            },
            data: {
                field_lon: "",
                field_lat: "",
                hidden: false,
            } satisfies Omit<FormbuilderCoordinatesItem, "type">,
        },
        render: ({ input, store }: ElementWrapperProps) => {
            return (
                <div
                    className="ngw-formbuilder-editor-widget-element"
                    onClick={(e) => {
                        e.stopPropagation();
                        store.setSelectedInput(input);
                    }}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                    }}
                >
                    <Stub placeholder={"22.35871"} />
                    <Stub placeholder={"40.08579"} />
                </div>
            );
        },
    },
    {
        elementId: "distance",
        icon: <DistanceIcon />,
        schema: {
            field: {
                type: "field",
                formLabel: gettext("Field"),
            },
        },
        storeData: {
            value: {
                name: gettext("Distance meter"),
                type: "distance",
            },
            data: {
                field: "",
            } satisfies Omit<FormbuilderDistanceItem, "type">,
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
                    <Stub placeholder={"0 " + gettext("m")} />
                </div>
            );
        },
    },
    {
        elementId: "average",
        icon: <AverageIcon />,
        schema: {
            field: {
                type: "field",
                formLabel: gettext("Field"),
            },
            samples: {
                type: "number",
                formLabel: gettext("Number of samples"),
                min: 2,
            },
        },
        storeData: {
            value: {
                name: gettext("Average calculator"),
                type: "average",
            },
            data: {
                field: "",
                samples: 2,
            } satisfies Omit<FormbuilderAverageItem, "type">,
        },
        render: ({ input, store }: ElementWrapperProps) => {
            return (
                <div
                    className="ngw-formbuilder-editor-widget-element"
                    onClick={(e) => {
                        e.stopPropagation();
                        store.setSelectedInput(input);
                    }}
                    style={{ display: "flex", gap: "8px" }}
                >
                    <Button
                        type="primary"
                        size="small"
                        style={{ pointerEvents: "none" }}
                    >
                        {gettext("Count")}
                    </Button>
                    <Stub style={{ flexGrow: "1" }} placeholder={"0"} />
                </div>
            );
        },
    },
    {
        elementId: "photo",
        icon: <PhotoIcon />,
        schema: {
            max_count: {
                type: "number",
                formLabel: gettext("Max number"),
                min: 1,
            },
            comment: {
                type: "string",
                formLabel: gettext("Comment"),
            },
        },
        storeData: {
            value: {
                name: gettext("Photo"),
                type: "photo",
            },
            data: {
                max_count: 1,
                comment: "",
            } satisfies Omit<FormbuilderPhotoItem, "type">,
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
                    <PhotoIcon
                        style={{
                            fontSize: "48px",
                            color: "var(--theme-color-primary)",
                        }}
                    />
                </div>
            );
        },
    },
    {
        elementId: "system",
        icon: <TextboxIcon />, // Should have own icon
        schema: {
            field: {
                type: "field",
                formLabel: gettext("Field"),
            },
            system: {
                type: "select",
                formLabel: gettext("Type"),
                selectOptions: systemItemTypes.map(([value, label]) => ({
                    value,
                    label,
                })),
            },
        },
        storeData: {
            value: {
                name: gettext("System field"),
                type: "system",
            },
            data: {
                field: "",
                system: "ngid_username",
            } satisfies Omit<FormbuilderSystemItem, "type">,
        },
        render: ({ input, store }: ElementWrapperProps) => {
            const placeholder = (systemItemTypes.find(
                ([v]) => v === input.data.system
            ) ?? [undefined, undefined])[1];
            return (
                <div
                    className="ngw-formbuilder-editor-widget-element"
                    onClick={(e) => {
                        e.stopPropagation();
                        store.setSelectedInput(input);
                    }}
                >
                    <Stub placeholder={placeholder} />
                </div>
            );
        },
    },
    {
        elementId: "dropdown",
        icon: <DropDownIcon />,
        schema: {
            field: {
                type: "field",
                formLabel: gettext("Field"),
            },
            remember: {
                type: "boolean",
                formLabel: gettext("Remember last value"),
            },
            search: {
                type: "boolean",
                formLabel: gettext("Enable search"),
            },
            free_input: {
                type: "boolean",
                formLabel: gettext("Allow free input"),
            },
            options: {
                type: "options",
                formLabel: gettext("Options"),
                optionsColumns: [
                    {
                        key: "value",
                        title: gettext("Value"),
                        width: "45%",
                        component: OptionsInputValueValue,
                    },
                    {
                        key: "label",
                        title: gettext("Label"),
                        width: "45%",
                        component: ({ row }: { row: OptionsRow }) => (
                            <OptionsInputValueStringProp
                                row={row}
                                columnKey={"label"}
                            />
                        ),
                    },
                    {
                        key: "initial",
                        title: gettext("Initial"),
                        width: "10%",
                        component: OptionsInputInitialValue,
                    },
                ],
            },
        },
        storeData: {
            value: {
                name: gettext("Dropdown"),
                type: "dropdown",
            },
            data: {
                field: "",
                remember: false,
                // search: false, // should be, somehow not in type now
                free_input: false,
                options: [],
            } satisfies Omit<FormbuilderDropdownItem, "type">,
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
                    <Stub placeholder={gettext("Dropdown")} />
                </div>
            );
        },
    },
    {
        elementId: "dropdown_dual",
        icon: <DualDropDownIcon />,
        schema: {
            field: {
                type: "field",
                formLabel: gettext("Field"),
            },
            remember: {
                type: "boolean",
                formLabel: gettext("Remember last value"),
            },
            label_first: {
                type: "string",
                formLabel: gettext("First label"),
            },
            label_second: {
                type: "string",
                formLabel: gettext("Second label"),
            },
            options: {
                type: "options",
                formLabel: gettext("Options"),
                optionsColumns: [
                    {
                        key: "value",
                        title: gettext("Value"),
                        width: "30%",
                        component: OptionsInputValueValue,
                    },
                    {
                        key: "first",
                        title: gettext("First label"),
                        width: "30%",
                        component: ({ row }: { row: OptionsRow }) => (
                            <OptionsInputValueStringProp
                                row={row}
                                columnKey={"first"}
                            />
                        ),
                    },
                    {
                        key: "second",
                        title: gettext("Second label"),
                        width: "30%",
                        component: ({ row }: { row: OptionsRow }) => (
                            <OptionsInputValueStringProp
                                row={row}
                                columnKey={"second"}
                            />
                        ),
                    },
                    {
                        key: "initial",
                        title: gettext("Initial"),
                        width: "10%",
                        component: OptionsInputInitialValue,
                    },
                ],
            },
        },
        storeData: {
            value: {
                name: gettext("Dual dropdown"),
                type: "dropdown_dual",
            },
            data: {
                field: "",
                remember: false,
                label_first: "",
                label_second: "",
                options: [],
            } satisfies Omit<FormbuilderDropdownDualItem, "type">,
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
                    <Stub placeholder={gettext("Dual dropdown")} />
                </div>
            );
        },
    },
    {
        elementId: "radio",
        icon: <RadioIcon />,
        schema: {
            field: {
                type: "field",
                formLabel: gettext("Field"),
            },
            remember: {
                type: "boolean",
                formLabel: gettext("Remember last value"),
            },

            options: {
                type: "options",
                formLabel: gettext("Options"),
                optionsColumns: [
                    {
                        key: "value",
                        title: gettext("Value"),
                        width: "45%",
                        component: OptionsInputValueValue,
                    },
                    {
                        key: "label",
                        title: gettext("Label"),
                        width: "45%",
                        component: ({ row }: { row: OptionsRow }) => (
                            <OptionsInputValueStringProp
                                row={row}
                                columnKey={"label"}
                            />
                        ),
                    },
                    {
                        key: "initial",
                        title: gettext("Initial"),
                        width: "10%",
                        component: OptionsInputInitialValue,
                    },
                ],
            },
        },
        storeData: {
            value: {
                name: gettext("Radio group"),
                type: "radio",
            },
            data: {
                field: "",
                remember: false,
                options: [],
            } satisfies Omit<FormbuilderRadioItem, "type">,
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
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        {input.data.options.map(
                            (option: OptionSingle, i: number) => (
                                <Radio
                                    checked={option.initial === true}
                                    key={option.value + i}
                                >
                                    {option.label || option.value}
                                </Radio>
                            )
                        )}
                    </div>
                    {input.data.options.length === 0 && (
                        <Stub placeholder={gettext("Radio group")} />
                    )}
                </div>
            );
        },
    },
    {
        elementId: "cascade",
        icon: <CascadeIcon />,
        schema: {
            field_primary: {
                type: "field",
                formLabel: gettext("Primary field"),
            },
            field_secondary: {
                type: "field",
                formLabel: gettext("Secondary field"),
            },
            remember: {
                type: "boolean",
                formLabel: gettext("Remember last value"),
            },

            options: {
                type: "cascade_options",
                formLabel: gettext("Options"),
                optionsColumns: [
                    {
                        key: "value",
                        title: gettext("Value"),
                        width: "45%",
                        component: OptionsInputValueValue,
                    },
                    {
                        key: "label",
                        title: gettext("Label"),
                        width: "45%",
                        component: ({ row }: { row: OptionsRow }) => (
                            <OptionsInputValueStringProp
                                row={row}
                                columnKey={"label"}
                            />
                        ),
                    },
                    {
                        key: "initial",
                        title: gettext("Initial"),
                        width: "10%",
                        component: OptionsInputInitialValue,
                    },
                ],
                dependentOptionsCoulmns: [
                    {
                        key: "value",
                        title: gettext("Value"),
                        width: "45%",
                        component: OptionsInputValueValue,
                    },
                    {
                        key: "label",
                        title: gettext("Label"),
                        width: "45%",
                        component: ({ row }: { row: OptionsRow }) => (
                            <OptionsInputValueStringProp
                                row={row}
                                columnKey={"label"}
                            />
                        ),
                    },
                    {
                        key: "initial",
                        title: gettext("Initial"),
                        width: "10%",
                        component: OptionsInputInitialValue,
                    },
                ],
            },
        },
        storeData: {
            value: {
                name: gettext("Dependent dropdowns"),
                type: "cascade",
            },
            data: {
                field_primary: "",
                field_secondary: "",
                remember: false,
                options: [],
            } satisfies Omit<FormbuilderCascadeItem, "type">,
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
                    <Stub placeholder={gettext("Dependent dropdowns")} />
                </div>
            );
        },
    },
];

export const allFieldProps = [
    ...new Set(
        elementsData
            .filter((el) =>
                Object.values(el.schema).find((prop) => prop.type === "field")
            )
            .flatMap((el) => {
                const res = Object.entries(el.schema)
                    .filter(([_key, val]) => val.type === "field")
                    .flatMap(([key]) => key);

                return res;
            })
    ),
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
