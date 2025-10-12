import type { Dayjs } from "dayjs";
import type { FC, ReactElement, ReactNode } from "react";

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
import { assert } from "@nextgisweb/jsrealm/error";
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

type StubProps = Pick<InputProps, "style" | "placeholder" | "suffix">;

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

type SelectOption = {
    value: string;
    label: string;
};

type OptionsColumn = {
    key: string;
    title: string;
    width: string;
    component: FC<any>;
};

export type SchemaEntry = {
    type: string;
    formLabel: string;
    min?: number;
    max?: number;
    datatypes?: string[];
    selectOptions?: SelectOption[];
    optionsColumns?: OptionsColumn[];
    dependentOptionsCoulmns?: OptionsColumn[];
};

export type Schema = {
    [key: string]: SchemaEntry;
};

// Infer default value based on schema entry type
type InferDefaultValue<T extends SchemaEntry> = T["type"] extends "boolean"
    ? boolean
    : T["type"] extends "select"
      ? string
      : T["type"] extends "options"
        ? any[]
        : T["type"] extends string
          ? string | number | boolean | any[] | undefined
          : unknown;

// Infer storeData from a schema
export type InferStoreData<S extends Schema> = {
    value: {
        name: string;
        type: string;
    };
    data: {
        [K in keyof S]: InferDefaultValue<S[K]>;
    };
};

export type ElementData<S extends Schema = Schema> = {
    elementId: string;
    icon: ReactElement;
    schema: S;
    storeData: InferStoreData<S>;
    render: FC<ElementWrapperProps>;
};

export const elementsData: ElementData[] = [
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
        render: ({ input, store }) => {
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
        render: ({ input, store }) => {
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
        render: ({ input, onGrabDrop, store }) => {
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
                datatypes: ["STRING", "INTEGER", "BIGINT", "REAL"],
            },
            max_lines: {
                type: "number",
                formLabel: gettext("Max. lines"),
                min: 1,
            },
            initial: {
                type: "string",
                formLabel: gettext("Initial value"),
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
                initial: "",
                remember: false,
                max_lines: 1,
            } satisfies Omit<FormbuilderTextboxItem, "type">,
        },
        render: ({ store, input }) => {
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
                datatypes: ["INTEGER", "BIGINT", "REAL", "STRING"],
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
        render: ({ input, store }) => {
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
                datatypes: ["DATETIME", "DATE", "TIME", "STRING"],
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
        render: ({ input, store }) => {
            type Datetime = FormbuilderDatetimeItem["datetime"];
            const initial = input.data?.initial as Dayjs | null;
            const datetime = input.data?.datetime as Datetime;
            let placeholder: string | undefined = undefined;
            if (initial) {
                if (datetime === "date") {
                    placeholder = initial.local().format("L");
                } else if (datetime === "time") {
                    placeholder = initial.local().format("LTS");
                } else if (datetime === "datetime") {
                    placeholder = initial.local().format("L LTS");
                }
            } else {
                placeholder = msgDatetimePlaceholder[datetime];
            }
            assert(placeholder !== undefined);
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
        elementId: "coordinates",
        icon: <CoordsIcon />,
        schema: {
            field_lon: {
                type: "field",
                formLabel: gettext("Longitude field"),
                datatypes: ["REAL", "STRING"],
            },
            field_lat: {
                type: "field",
                formLabel: gettext("Lattitude field"),
                datatypes: ["REAL", "STRING"],
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
        render: ({ input, store }) => {
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
                datatypes: ["REAL", "INTEGER", "BIGINT", "STRING"],
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
        render: ({ input, store }) => {
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
                datatypes: ["REAL", "INTEGER", "BIGINT", "STRING"],
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
        render: ({ input, store }) => {
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
                max: 20,
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
        render: ({ input, store }) => {
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
                datatypes: ["STRING"],
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
        render: ({ input, store }) => {
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
                datatypes: ["STRING"],
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
                        component: ({
                            row,
                        }: {
                            row: OptionsRow;
                        }): ReactNode => (
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
                search: false,
                free_input: false,
                options: [],
            } satisfies Omit<FormbuilderDropdownItem, "type">,
        },
        render: ({ input, store }) => {
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
                datatypes: ["STRING"],
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
                        component: ({
                            row,
                        }: {
                            row: OptionsRow;
                        }): ReactNode => (
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
                        component: ({
                            row,
                        }: {
                            row: OptionsRow;
                        }): ReactNode => (
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
        render: ({ input, store }) => {
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
                datatypes: ["STRING"],
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
                        component: ({
                            row,
                        }: {
                            row: OptionsRow;
                        }): ReactNode => (
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
        render: ({ input, store }) => {
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
                datatypes: ["STRING"],
            },
            field_secondary: {
                type: "field",
                formLabel: gettext("Secondary field"),
                datatypes: ["STRING"],
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
        render: ({ input, store }) => {
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
    .filter(
        (element) =>
            !Object.keys(element.storeData.data).find((key) =>
                allFieldProps.includes(key)
            )
    )
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
