import { observer } from "mobx-react-lite";

import { getIconComponent } from "../helper";
import type { IconName } from "../helper";

import { elements } from "./elements_data";
import type { FormElementData } from "./elements_data";

export const FormElement = observer(
    ({
        data,
        grabCallback,
    }: {
        data: FormElementData;
        grabCallback: (element: FormElementData) => void;
    }) => {
        const IconComp = getIconComponent(data.value.type as IconName);

        return (
            <div
                className={"form_element_fbwidget"}
                data-name={data.value.type}
                onMouseDown={(e) => {
                    const name = e.currentTarget.dataset.name;
                    const element = elements.find(
                        (el) => el.value.type === name
                    );
                    if (element) grabCallback(element);
                }}
            >
                <IconComp />
                <span>{data.value.name}</span>
            </div>
        );
    }
);

FormElement.displayName = "FormElement";
