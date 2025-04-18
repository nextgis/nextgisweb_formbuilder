import { observer } from "mobx-react-lite";
import { useEffect } from "react";

import { Form, Input } from "@nextgisweb/gui/antd";
import { gettextf } from "@nextgisweb/pyramid/i18n";

import type { FormbuilderEditorStore } from "../FormbuilderEditorStore";
import type { UIListItem, UITab } from "../type";

// Consider refactor
const updateTabTitles = (tabsObject: UIListItem, newTitles: any) => {
    const updatedTabsObject = JSON.parse(JSON.stringify(tabsObject));

    updatedTabsObject.value.tabs.forEach((tab: any, index: number) => {
        if (Object.prototype.hasOwnProperty.call(newTitles, index.toString())) {
            tab.title = newTitles[index.toString()];
        }
    });

    return updatedTabsObject;
};

export const TabsCustomModifier = observer(
    ({ store }: { store: FormbuilderEditorStore }) => {
        const tabs = store?.selectedInput?.value?.tabs || [];

        const tabTitles = tabs.map((tab: UITab) => tab.title);

        const [form] = Form.useForm();

        useEffect(() => {
            form.setFieldsValue(tabTitles);
        }, [tabTitles, form]);

        const onFormChange = () => {
            if (!store?.selectedInput && !store?.selectedInput?.id) return;

            const currentTabsInputFromStore = store.getElementById(
                store?.selectedInput?.id as number
            );

            if (currentTabsInputFromStore) {
                const updatedTabs = updateTabTitles(
                    currentTabsInputFromStore,
                    form.getFieldsValue()
                );

                store.setNewElementValue(
                    store.selectedInput.id as number,
                    updatedTabs.value
                );

                if (store.setDirty) store.setDirty(true);
            }
        };

        return (
            <div>
                <Form
                    style={{ padding: "4px" }}
                    size="small"
                    form={form}
                    name="tabsCustomModifier"
                    onFieldsChange={onFormChange}
                    autoComplete="off"
                    labelCol={{ flex: "130px" }}
                    labelAlign="left"
                    labelWrap
                    layout="horizontal"
                >
                    {tabs.map((tab: UITab, i: number) => (
                        <Form.Item
                            key={i}
                            label={gettextf("Tab {}")(i + 1)}
                            name={i}
                        >
                            <Input />
                        </Form.Item>
                    ))}
                </Form>
            </div>
        );
    }
);

TabsCustomModifier.displayName = "TabsCustomModifier";
