import { observer } from "mobx-react-lite";

import { gettext } from "@nextgisweb/pyramid/i18n";

import { FormElement } from "../FormElement";
import type { FormbuilderEditorStore } from "../FormbuilderEditorStore";
import { elementsData, getNewTabsElement } from "../element";
import type { FormElementData } from "../element";

const msgHeader = gettext("Elements");

export const ElementsPanel = observer(
    ({ store }: { store: FormbuilderEditorStore }) => {
        return (
            <div className="ngw-formbuilder-editor-widget-panel ngw-formbuilder-editor-widget-panel-elements">
                <div className="panel-header">{msgHeader}</div>
                <div className="panel-body">
                    {elementsData.map((element) => (
                        <FormElement
                            key={element.elementId}
                            data={element.storeData}
                            icon={element.icon}
                            grabCallback={(input: FormElementData) => {
                                if (input) {
                                    if (input.value.type === "tabs") {
                                        const tabsInput =
                                            getNewTabsElement(store);
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
            </div>
        );
    }
);

ElementsPanel.displayName = "ElementsPanel";
