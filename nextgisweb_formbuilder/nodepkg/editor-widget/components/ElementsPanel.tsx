import { observer } from "mobx-react-lite";

import { gettext } from "@nextgisweb/pyramid/i18n";

import { FormElement } from "../FormElement";
import type { FormbuilderEditorStore } from "../FormbuilderEditorStore";
import { elements, getNewTabsElement } from "../elements_data";
import type { FormElementData } from "../elements_data";

const msgHeader = gettext("Elements");

export const ElementsPanel = observer(
    ({ store }: { store: FormbuilderEditorStore }) => {
        return (
            <div className="ngw-formbuilder-editor-widget-panel">
                <div className="panel-header">{msgHeader}</div>
                {elements.map((element: FormElementData) => (
                    <FormElement
                        data={element}
                        key={element.value.type}
                        grabCallback={(input: FormElementData) => {
                            if (input) {
                                if (input.value.type === "tabs") {
                                    const tabsInput = getNewTabsElement(store);
                                    store.setGrabbedInput({
                                        ...tabsInput,
                                        id: store.getNewListIndex(),
                                    });
                                } else {
                                    store.setGrabbedInput({
                                        ...input,
                                        id: store.getNewListIndex(),
                                    });
                                }

                                store.setDragging(true);
                            }
                        }}
                    />
                ))}
            </div>
        );
    }
);

ElementsPanel.displayName = "ElementsPanel";
