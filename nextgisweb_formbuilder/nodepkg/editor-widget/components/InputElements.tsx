import { Checkbox, Input } from "antd";
import { observer } from "mobx-react-lite";

import type { FormbuilderEditorStore } from "../FormbuilderEditorStore";
import type { GrabbedInputComposite, UIListItem } from "../type";

import { TabsFormComponent } from "./TabsFormComponent";

export const InputWrapper = observer(
    ({
        input,
        i,
        store,
    }: {
        input: UIListItem;
        i: number;
        store: FormbuilderEditorStore;
    }) => {
        return (
            <div
                key={input.value.type + i}
                data-elid={i}
                style={{
                    display: "flex",
                    width: "100%",
                    justifyContent: "space-between",
                    alignContent: "center",
                    color: "black",
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    store.setSelectedInput(input);
                }}
            >
                <div
                    style={{
                        flexGrow: 1,
                        display: "flex",
                        alignItems: "center",
                    }}
                >
                    <span>{input?.value.type}</span>
                    {` > `}
                    <span>{input?.data?.label}</span>
                </div>
            </div>
        );
    }
);

InputWrapper.displayName = "InputWrapper";

export const CheckBoxWrapper = observer(
    ({
        input,
        i,
        store,
    }: {
        input: UIListItem;
        i: number;
        store: FormbuilderEditorStore;
    }) => {
        return (
            <div
                key={input.value.type + i}
                data-elid={i}
                style={{
                    display: "flex",
                    width: "100%",
                    justifyContent: "space-between",
                    alignContent: "center",
                    color: "black",
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    store.setSelectedInput(input);
                }}
            >
                <div
                    style={{
                        flexGrow: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <Checkbox checked={input.data?.init_value} />
                    <span>{input?.data?.label}</span>
                </div>
            </div>
        );
    }
);

CheckBoxWrapper.displayName = "CheckBoxWrapper";

export const TextEditWrapper = observer(
    ({
        store,
        input,
        i,
    }: {
        input: UIListItem;
        i: number;
        store: FormbuilderEditorStore;
    }) => {
        return (
            <div
                key={input.value.type + i}
                data-elid={i}
                style={{
                    display: "flex",
                    width: "100%",
                    justifyContent: "space-between",
                    alignContent: "center",
                    color: "black",
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    store.setSelectedInput(input);
                }}
            >
                <div
                    style={{
                        flexGrow: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <Input size="small" value={""} />
                </div>
            </div>
        );
    }
);

TextEditWrapper.displayName = "TextEditWrapper";

export const LabelWrapper = observer(
    ({
        input,
        i,
        store,
    }: {
        input: UIListItem;
        i: number;
        store: FormbuilderEditorStore;
    }) => {
        return (
            <div
                key={input.value.type + i}
                data-elid={i}
                style={{
                    display: "flex",
                    width: "100%",
                    justifyContent: "space-between",
                    alignContent: "center",
                    color: "black",
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    store.setSelectedInput(input);
                }}
            >
                <div
                    style={{
                        flexGrow: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <span>{input?.data?.label}</span>
                </div>
            </div>
        );
    }
);

LabelWrapper.displayName = "LabelWrapper";

export const VoidSpaceWrapper = observer(
    ({
        input,
        i,
        store,
    }: {
        input: UIListItem;
        i: number;
        store: FormbuilderEditorStore;
    }) => {
        return (
            <div
                key={input.value.type + i}
                data-elid={i}
                style={{
                    display: "flex",
                    width: "100%",
                    justifyContent: "space-between",
                    alignContent: "center",
                    color: "black",
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    store.setSelectedInput(input);
                }}
            ></div>
        );
    }
);

VoidSpaceWrapper.displayName = "VoidSpaceWrapper";

export const TabsWrapper = observer(
    ({
        input,
        i,
        onGrabDrop,
        store,
    }: {
        input: UIListItem;
        i: number;
        onGrabDrop: () => GrabbedInputComposite | null;
        store: FormbuilderEditorStore;
    }) => {
        return (
            <div
                key={input.value.type + i}
                data-elid={i}
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                }}
                onClick={(e) => {
                    e.stopPropagation();
                }}
            >
                <div style={{ flexGrow: 1, color: "black" }}>
                    <TabsFormComponent
                        store={store}
                        value={input}
                        onGrabDrop={onGrabDrop}
                    />
                </div>
            </div>
        );
    }
);

TabsWrapper.displayName = "TabsWrapper";

export const getInputComponent = (type: string) => {
    switch (type) {
        case "tabs":
            return TabsWrapper;

        case "checkbox":
            return CheckBoxWrapper;

        case "textbox":
            return TextEditWrapper;

        case "label":
            return LabelWrapper;

        case "void_space":
            return VoidSpaceWrapper;

        default:
            return InputWrapper;
    }
};
