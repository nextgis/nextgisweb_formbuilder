import { Checkbox, Input } from "antd";
import { observer } from "mobx-react-lite";
import type { FC } from "react";

import { assert } from "@nextgisweb/jsrealm/error";

import type { FormbuilderEditorStore } from "./FormbuilderEditorStore";
import { TabsFormComponent } from "./components/TabsFormComponent";
import type { GrabbedInputComposite, UIListItem } from "./type";

interface ElementWrapperProps {
    input: UIListItem;
    i: number;
    store: FormbuilderEditorStore;
    onGrabDrop: () => GrabbedInputComposite | null;
}

export const LabelWrapper: FC<ElementWrapperProps> = observer(
    ({ input, i, store }) => {
        return (
            <div
                key={input.value.type + i}
                className="ngw-formbuilder-editor-widget-element"
                data-elid={i}
                onClick={(e) => {
                    e.stopPropagation();
                    store.setSelectedInput(input);
                }}
            >
                {input?.data?.label ?? <>&nbsp;</>}
            </div>
        );
    }
);

LabelWrapper.displayName = "LabelWrapper";

export const TabsWrapper: FC<ElementWrapperProps> = observer(
    ({ input, i, onGrabDrop, store }) => {
        return (
            <div
                key={input.value.type + i}
                className="ngw-formbuilder-editor-widget-element"
                data-elid={i}
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
    }
);

TabsWrapper.displayName = "TabsWrapper";

export const TextboxWrapper: FC<ElementWrapperProps> = observer(
    ({ store, input, i }) => {
        return (
            <div
                key={input.value.type + i}
                className="ngw-formbuilder-editor-widget-element"
                data-elid={i}
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
    }
);

TextboxWrapper.displayName = "TextboxWrapper";

export const CheckboxWrapper: FC<ElementWrapperProps> = observer(
    ({ input, i, store }) => {
        return (
            <div
                key={input.value.type + i}
                className="ngw-formbuilder-editor-widget-element"
                data-elid={i}
                onClick={(e) => {
                    e.stopPropagation();
                    store.setSelectedInput(input);
                }}
            >
                <Checkbox
                    style={{ pointerEvents: "none" }}
                    checked={input.data?.init_value}
                >
                    {input?.data?.label}
                </Checkbox>
            </div>
        );
    }
);

CheckboxWrapper.displayName = "CheckboxWrapper";

export const getInputComponent = (type: string) => {
    switch (type) {
        case "label":
            return LabelWrapper;
        case "tabs":
            return TabsWrapper;
        case "textbox":
            return TextboxWrapper;
        case "checkbox":
            return CheckboxWrapper;
        default:
            assert(false);
    }
};
