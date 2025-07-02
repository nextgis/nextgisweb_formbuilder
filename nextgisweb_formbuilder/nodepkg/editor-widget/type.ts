export type UIListItem = {
    value: {
        type: string;
        name?: string;
        image?: string;
        tabs?: UITab[];
    };
    data: any;
    id?: number;
};

export interface DragPos {
    x: number;
    y: number;
}

export type UITab = {
    title: string;
    active: boolean;
    items: {
        listId: number;
        list: UIListItem[];
    };
};

export type FormBuilderUIData = {
    listId: number;
    list: UIListItem[];
};

export type GrabbedInputComposite = UIListItem & { dropCallback?: () => void };
