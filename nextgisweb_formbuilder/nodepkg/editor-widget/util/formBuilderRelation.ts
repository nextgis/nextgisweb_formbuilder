export const formBuilderRelation = (item: any) => {
    if (item.value?.tabs) {
        return item.value.tabs.flatMap((tab: any) => tab.items?.list || []);
    }
    return item.list;
};
