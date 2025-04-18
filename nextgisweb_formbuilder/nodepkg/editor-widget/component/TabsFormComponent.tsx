import classNames from "classnames";
import { observer } from "mobx-react-lite";

import { Button } from "@nextgisweb/gui/antd";
import { AddIcon, RemoveIcon } from "@nextgisweb/gui/icon";
import { gettext, gettextf } from "@nextgisweb/pyramid/i18n";

import type {
    FormbuilderEditorField,
    FormbuilderEditorStore,
} from "../FormbuilderEditorStore";
import { isNonFieldElement } from "../element";
import type {
    FormBuilderUIData,
    GrabbedInputComposite,
    UIListItem,
    UITab,
} from "../type";
import { getNewFieldKeynamePostfix } from "../util/newFieldKeyname";

import { Mockup } from "./Mockup";

import "./TabsFormComponent.less";

const updateActiveTab = (input: UIListItem): UIListItem => {
    const { value } = input;
    const tabs = value?.tabs || [];

    const updatedTabs = tabs.map((tab) => ({
        ...tab,
        active: tab.active,
    }));

    return {
        ...input,
        value: {
            ...value,
            tabs: updatedTabs,
        },
    };
};

const deleteTab = (input: UIListItem, tabIndex: number): UIListItem => {
    const { value } = input;
    const tabs = value?.tabs || [];

    const updatedTabs = tabs
        .filter((_, index) => index !== tabIndex)
        .map((tab, i) => {
            if (i === 0) {
                // maybe better set previous i
                return { ...tab, active: true };
            } else {
                return { ...tab, active: false };
            }
        });

    return {
        ...input,
        data: {},
        value: {
            ...value,
            tabs: updatedTabs,
        },
    };
};

export const TabsFormComponent = observer(
    ({
        store,
        value,
        onGrabDrop,
    }: {
        store: FormbuilderEditorStore;
        value: UIListItem;
        onGrabDrop: () => GrabbedInputComposite | null;
    }) => {
        const rawData = value;

        const activeTab = rawData.value.tabs?.find((tab) => tab.active);
        const activeTabItems = activeTab?.items;

        const tabsInputFromStore = rawData
            ? updateActiveTab(rawData as UIListItem)
            : undefined;

        const addTab = () => {
            if (!tabsInputFromStore) {
                return;
            }
            const newIdx = (tabsInputFromStore.value.tabs || []).length + 1;
            const newTab = {
                title: gettextf("Tab {}")(newIdx),
                active: false,
                items: {
                    listId: store.getNewListIndex(),
                    list: [],
                },
            };

            const updatedTabsInput = {
                ...tabsInputFromStore,
                value: {
                    ...tabsInputFromStore.value,
                    tabs: [...(tabsInputFromStore.value?.tabs || []), newTab],
                },
            };

            store.setNewElementValue(
                value.id as number,
                updatedTabsInput.value
            );

            if (tabsInputFromStore?.id === store?.selectedInput?.id) {
                store.setSelectedInput(updatedTabsInput);
            }

            if (store.setDirty) store.setDirty(true);
        };

        const setActive = (currentTabIndex: number) => {
            if (!tabsInputFromStore) {
                return;
            }

            const deepClonedTabs = tabsInputFromStore.value.tabs
                ? [...tabsInputFromStore.value.tabs]
                : [];

            const updatedTabs = deepClonedTabs.map(
                (tab: UITab, index: number) => {
                    if (index === currentTabIndex) {
                        tab.active = true;
                        return { ...tab, active: true };
                    } else {
                        return { ...tab, active: false };
                    }
                }
            );

            const updatedTabsInput = {
                ...tabsInputFromStore,
                data: {
                    ...tabsInputFromStore?.data,
                },
                value: {
                    ...tabsInputFromStore?.value,
                    tabs: [...updatedTabs],
                },
            };

            // reason for refactor
            store.setNewElementData(value.id as number, updatedTabsInput.data);
            store.setNewElementValue(
                value.id as number,
                updatedTabsInput.value
            );

            store.setSelectedInput(updatedTabsInput);
        };

        return (
            <div className="ngw-formbuilder-editor-widget-tabs-element">
                <div className="tabs">
                    {(tabsInputFromStore?.value.tabs || []).map((tab, i) => (
                        <div
                            key={tab.title}
                            className={classNames("tab", {
                                active: tab.active,
                            })}
                            title={tab.title}
                            onClick={() => {
                                setActive(i);
                            }}
                            onMouseUp={() => {
                                const droppedInput = onGrabDrop();

                                // check if dropping parent into child
                                if (
                                    store.grabbedInput?.id &&
                                    value.id &&
                                    store.isNestedWithin(
                                        store.grabbedInput.id,
                                        value.id
                                    )
                                ) {
                                    return;
                                }

                                if (droppedInput?.dropCallback) {
                                    droppedInput.dropCallback();
                                }

                                if (!droppedInput) return;

                                // Prepare dropping input with field linked
                                // and add field to store

                                const getDroppingFieldValue = () => {
                                    if (store.isMoving) {
                                        return store?.grabbedInput?.data?.field;
                                    }

                                    if (
                                        isNonFieldElement(store?.grabbedInput)
                                    ) {
                                        return undefined;
                                    }

                                    return `field_${store.fields.length + 1}`;
                                };

                                const droppingInputWithField = {
                                    ...store.grabbedInput,
                                    data: {
                                        ...store?.grabbedInput?.data,
                                        field: getDroppingFieldValue(),
                                    },
                                };

                                if (
                                    !store.isMoving &&
                                    !isNonFieldElement(droppedInput)
                                ) {
                                    const newFieldPostfix =
                                        getNewFieldKeynamePostfix(store.fields);

                                    const newFieldItem: FormbuilderEditorField =
                                        {
                                            display_name: `${gettext("Field")} ${newFieldPostfix}`,
                                            keyname: `field_${newFieldPostfix}`,
                                            datatype: "STRING",
                                            existing: false,
                                        };

                                    const fields = store.fields;
                                    store.setFields([...fields, newFieldItem]);
                                }

                                const freshTabs =
                                    store.getElementById(
                                        tabsInputFromStore?.id as number
                                    )?.value.tabs || [];

                                const updatedTabs = freshTabs.map(
                                    (tab, index) => {
                                        if (index === i) {
                                            return {
                                                ...tab,
                                                items: {
                                                    listId: tab.items.listId,
                                                    list: [
                                                        ...tab.items.list,
                                                        {
                                                            ...droppingInputWithField,
                                                        },
                                                    ],
                                                },
                                            };
                                        } else {
                                            return { ...tab };
                                        }
                                    }
                                );

                                const updatedTabsInput = {
                                    ...tabsInputFromStore,
                                    value: {
                                        ...tabsInputFromStore?.value,
                                        tabs: [...updatedTabs],
                                    },
                                };

                                store.setNewElementValue(
                                    value.id as number,
                                    updatedTabsInput.value
                                );

                                if (store.setDirty) store.setDirty(true);
                            }}
                        >
                            <span>{tab.title}</span>
                            <Button
                                size="small"
                                type="text"
                                icon={<RemoveIcon />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!tabsInputFromStore) return;
                                    const updatedTabsInput = deleteTab(
                                        tabsInputFromStore,
                                        i
                                    );

                                    store.setNewElementData(
                                        value.id as number,
                                        updatedTabsInput.data
                                    );
                                    store.setNewElementValue(
                                        value.id as number,
                                        updatedTabsInput.value
                                    );

                                    if (store.setDirty) store.setDirty(true);

                                    store.setSelectedInput(updatedTabsInput);
                                }}
                            />
                        </div>
                    ))}
                    <Button
                        size="small"
                        type="text"
                        icon={<AddIcon />}
                        onClick={(e) => {
                            e.stopPropagation();
                            addTab();
                        }}
                    />
                </div>
                <div className="container">
                    <Mockup
                        inputsWithId={activeTabItems as FormBuilderUIData}
                        store={store}
                        parentId={value.id}
                    />
                </div>
            </div>
        );
    }
);

TabsFormComponent.displayName = "TabsFormComponent";
