import { observer } from "mobx-react-lite";
import type { FC, ReactNode } from "react";

import { elementsData } from "./element";
import type { ElementData, FormElementData } from "./element";

export interface FormElementProps {
    data: ElementData;
    icon: ReactNode;
    grabCallback: (element: FormElementData) => void;
}

export const FormElement: FC<FormElementProps> = observer(
    ({ data, icon, grabCallback }) => {
        return (
            <div
                className={"ngw-formbuilder-editor-widget-form-element"}
                data-name={data.storeData.value.type}
                onMouseDown={(e) => {
                    const name = e.currentTarget.dataset.name;
                    const element = elementsData.find(
                        (el) => el.storeData.value.type === name
                    );
                    if (element) grabCallback(element.storeData);
                }}
            >
                {icon}
                <span>{data.storeData.value.name}</span>
            </div>
        );
    }
);

FormElement.displayName = "FormElement";
