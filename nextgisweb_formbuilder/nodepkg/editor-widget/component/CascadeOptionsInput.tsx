import "./CascadeOptionsInput.less";

import classNames from "classnames";
import { clamp, remove } from "lodash-es";
import { action, observable } from "mobx";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useState } from "react";

import type { OptionSingle } from "@nextgisweb/formbuilder/type/api";
import { Button, Modal } from "@nextgisweb/gui/antd";
import { EdiTable } from "@nextgisweb/gui/edi-table";
import type { EdiTableColumn, EdiTableStore } from "@nextgisweb/gui/edi-table";
import { useThemeVariables } from "@nextgisweb/gui/hook";
import { gettext } from "@nextgisweb/pyramid/i18n";

import { OptionsEdiTableStore } from "./SimpleTableStores";
import type { OptionsRow } from "./SimpleTableStores";

const msgEdit = gettext("Edit");
const msgOptions = gettext("Options");
const msgDependentStub = gettext(
    "Select or add an option in the table above to see dependent options"
);

type ParentRowStringKeys = {
    [K in keyof ParentRow]: ParentRow[K] extends string | undefined
        ? K
        : ParentRow[K] extends string
          ? K
          : never;
}[keyof ParentRow];

type StringKeys<T> = {
    [K in keyof T]: T[K] extends string | undefined ? K : never;
}[keyof T];

export type RowStringKeys = StringKeys<ParentRow> | StringKeys<OptionsRow>;

export class ParentRow {
    private static keySeq = 0;
    readonly key = ++ParentRow.keySeq;
    readonly store: ParentStore;

    @observable.ref accessor initial: boolean = false;
    @observable.ref accessor value: string = "";
    @observable.ref accessor label: string = "";
    @observable.ref accessor items = observable.array<OptionSingle>([]);

    constructor(store: ParentStore, data: Partial<ParentRow> = {}) {
        this.store = store;
        Object.assign(this, data);
    }

    @action.bound
    setStringProp(prop: ParentRowStringKeys, value: string) {
        (this[prop] as string) = value;
    }

    @action.bound
    setValue(value: string) {
        this.value = value;
        if (this === this.store.placeholder) {
            this.store.rotatePlaceholder();
        }
    }

    @action.bound
    setInitial(value: boolean) {
        this.initial = value;
        for (const row of this.store.rows) {
            if (row !== this) {
                row.initial = false;
            }
        }
    }
}

class ParentStore implements EdiTableStore<ParentRow> {
    readonly rows = observable.array<ParentRow>();

    @observable.ref accessor selectedRowKey: number | undefined = undefined;
    @observable.ref accessor placeholder = new ParentRow(this, {});

    @action.bound
    setSelectedRowKey(val: number | undefined) {
        this.selectedRowKey = val;
    }

    @action.bound
    rotatePlaceholder() {
        this.rows.push(this.placeholder);

        if (this.rows.length === 1) {
            this.rows[0].setInitial(true);
        }

        this.placeholder = new ParentRow(this, {});
    }

    @action.bound
    addRow(data: Partial<ParentRow>) {
        this.rows.push(new ParentRow(this, data));
    }

    @action.bound
    setRows(data: Partial<ParentRow>[]) {
        data.forEach((r: Partial<ParentRow>) => {
            this.rows.push(new ParentRow(this, r));
        });
    }

    @action.bound
    setRowItemsByValue(targetValue: string, newItems: OptionSingle[]) {
        const updatedRows = this.rows.map((row) => {
            if (row.value === targetValue) {
                // replace method doesnt work somehow, prolly fix needed
                row.items = observable.array([...newItems]);
                return row;
            } else {
                return row;
            }
        });

        this.rows.replace(updatedRows);
    }

    @action.bound
    setRowItemsByKey(targetKey: number, newItems: OptionSingle[]) {
        const updatedRows = this.rows.map((row) => {
            if (row.key === targetKey) {
                // replace method doesnt work somehow, prolly fix needed
                row.items = observable.array([...newItems]);
                return row;
            } else {
                return row;
            }
        });

        this.rows.replace(updatedRows);
    }

    @action.bound
    cloneRow(row: ParentRow) {
        const { value, label } = row;
        const idx = this.rows.indexOf(row) + 1;
        this.rows.splice(idx, 0, new ParentRow(this, { value, label }));
    }

    @action.bound
    deleteRow(row: ParentRow) {
        this.rows.remove(row);

        if (row.key === this.selectedRowKey) {
            this.selectedRowKey = undefined;
        }
    }

    @action.bound
    clear() {
        this.rows.clear();
    }

    @action.bound
    moveRow(row: ParentRow, index: number) {
        index = clamp(index, 0, this.rows.length - 1);

        const newRows = [...this.rows];
        remove(newRows, (i) => i === row);
        newRows.splice(index, 0, row);
        this.rows.replace(newRows);
    }
}

interface CascadeOptionsInputProps {
    value?: ParentRow[];
    onChange?: (value: Partial<ParentRow>[]) => void;
    columns?: EdiTableColumn<ParentRow>[];
    depColumns?: EdiTableColumn<OptionsRow>[];
}

export const CascadeOptionsInput = observer(
    ({ value, onChange, columns, depColumns }: CascadeOptionsInputProps) => {
        const [isModalOpen, setIsModalOpen] = useState(false);
        const [activeRowKey, setActiveRowKey] = useState<number>();

        const [store] = useState(() => new ParentStore());
        const [dependentStore] = useState(() => new OptionsEdiTableStore());

        useEffect(() => {
            if (activeRowKey) {
                const activeRowItems = dependentStore.rows.map(
                    ({ initial, value, label }) => ({
                        initial,
                        value,
                        label: label || "",
                    })
                );

                store.setRowItemsByKey(activeRowKey, activeRowItems);
            }

            if (store.selectedRowKey) {
                const newActiveRowKey = store.rows.find(
                    (row) => row.key === store.selectedRowKey
                )?.key;

                setActiveRowKey(newActiveRowKey);

                dependentStore.clear();
                const selectedRowItems =
                    store.rows.find((row) => row.key === store.selectedRowKey)
                        ?.items || [];
                dependentStore.setRows(selectedRowItems);
            }
        }, [
            activeRowKey,
            dependentStore,
            store,
            store.rows,
            store.selectedRowKey,
        ]);

        const showModal = () => {
            if (value) {
                store.clear();
                const rows = value;
                store.setRows(rows);
            }

            store.setSelectedRowKey(undefined);
            setIsModalOpen(true);
        };

        const handleCancel = () => {
            if (store.selectedRowKey) {
                const items = dependentStore.rows.map(
                    ({ initial, value, label }) => ({
                        initial,
                        value,
                        label: label || "",
                    })
                );

                store.setRowItemsByKey(store.selectedRowKey, items);
            }

            if (onChange) {
                onChange(
                    store.rows.map(({ initial, value, label, items }) => ({
                        initial,
                        value,
                        label,
                        items,
                    }))
                );
            }

            store.setSelectedRowKey(undefined);
            setIsModalOpen(false);
        };

        const { selectedRowKey } = store;
        const getRowClassName = useCallback(
            (row: ParentRow) =>
                classNames({
                    "ant-table-row-selected": row.key === selectedRowKey,
                }),
            [selectedRowKey]
        );

        const themeVariables = useThemeVariables({
            "border-radius": "borderRadius",
            "color-border-secondary": "colorBorderSecondary",
            "color-text-quaternary": "colorTextQuaternary",
        });

        return (
            <>
                <Button style={{ width: "100%" }} onClick={showModal}>
                    {msgEdit}
                </Button>
                <Modal
                    className="ngw-formbuilder-editor-widget-cascade-options-input-modal"
                    styles={{ body: themeVariables }}
                    width="" // Do not set the default (520px) width
                    centered={true}
                    title={msgOptions}
                    open={isModalOpen}
                    destroyOnClose={true}
                    footer={false}
                    onCancel={handleCancel}
                >
                    <EdiTable
                        size="small"
                        card={true}
                        parentHeight={true}
                        store={store}
                        columns={columns || []}
                        rowKey="key"
                        rowClassName={getRowClassName}
                    />

                    <h3>{gettext("Dependent options")}</h3>
                    {store.selectedRowKey &&
                    store.placeholder.key !== store.selectedRowKey ? (
                        <EdiTable
                            size="small"
                            card={true}
                            parentHeight={true}
                            store={dependentStore}
                            columns={depColumns || []}
                            rowKey="key"
                        />
                    ) : (
                        <div className="dependent-stub">{msgDependentStub}</div>
                    )}
                </Modal>
            </>
        );
    }
);

CascadeOptionsInput.displayName = "CascadeOptionsInput";
