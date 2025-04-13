import classNames from "classnames";
import { observer } from "mobx-react-lite";

import { Button } from "@nextgisweb/gui/antd";
import { AddIcon, RemoveIcon } from "@nextgisweb/gui/icon";
import { gettextf } from "@nextgisweb/pyramid/i18n";

import type {
    FormbuilderEditorField,
    FormbuilderEditorStore,
} from "../FormbuilderEditorStore";
import { isNonFieldElement } from "../elements_data";
import type { GrabbedInputComposite, UIListItem, UITab } from "../type";
import { getNewFieldKeyname } from "../util/newFieldKeyname";

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
    const { data, value } = input;
    const { currentPage } = data;
    const tabs = value?.tabs || [];

    const updatedTabs = tabs.filter((_, index) => index !== tabIndex);

    let newCurrentPage = currentPage;

    if (tabIndex === currentPage) {
        if (updatedTabs.length === 0) {
            newCurrentPage = -1;
        } else if (currentPage >= updatedTabs.length) {
            newCurrentPage = updatedTabs.length - 1;
        } else {
            newCurrentPage = currentPage;
        }
    } else if (tabIndex < currentPage) {
        newCurrentPage = currentPage - 1;
    }

    const finalTabs = updatedTabs.map((tab, index) => ({
        ...tab,
        active: index === newCurrentPage,
    }));

    return {
        ...input,
        data: {
            currentPage: newCurrentPage,
        },
        value: {
            ...value,
            tabs: finalTabs,
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
        const rawData = store.getElementById(value.id as number);

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
                    list: [{ value: { type: "dropPlace" }, data: null }],
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
                    currentPage: currentTabIndex,
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

        const getActiveTabItems = () => {
            // something delirious here

            const activeTab = (tabsInputFromStore?.value.tabs || []).find(
                (tab) => !!tab.active
            );

            if (activeTab?.items.listId) {
                const activeTabItemsFromStore = store.getListById(
                    activeTab?.items.listId
                );

                return activeTabItemsFromStore;
            } else return null;
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
                                    const newKeyname = getNewFieldKeyname(
                                        store.fields
                                    );

                                    const newFieldItem: FormbuilderEditorField =
                                        {
                                            display_name: newKeyname,
                                            keyname: newKeyname,
                                            datatype: "STRING",
                                            existing: false,
                                        };

                                    const fields = store.fields;
                                    store.setFields([...fields, newFieldItem]);
                                }

                                const updatedTabs = (
                                    tabsInputFromStore?.value.tabs || []
                                ).map((tab, index) => {
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
                                                    {
                                                        value: {
                                                            type: "dropPlace",
                                                        },
                                                        data: null,
                                                    },
                                                ],
                                            },
                                        };
                                    } else {
                                        return { ...tab };
                                    }
                                });

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
                        inputsWithId={getActiveTabItems()}
                        store={store}
                        parentId={value.id}
                    />
                </div>
            </div>
        );
    }
);

TabsFormComponent.displayName = "TabsFormComponent";
