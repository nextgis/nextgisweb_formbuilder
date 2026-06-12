import "./CascadeOptionsInput.less";

import classNames from "classnames";
import { clamp, remove } from "lodash-es";
import { action, observable } from "mobx";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useState } from "react";

import type { OptionSingle } from "@nextgisweb/formbuilder/type/api";
import { Button, ConfigProvider, Modal, Space } from "@nextgisweb/gui/antd";
import { CsvImporterModal } from "@nextgisweb/gui/csv-importer";
import { EdiTable } from "@nextgisweb/gui/edi-table";
import type { EdiTableColumn, EdiTableStore } from "@nextgisweb/gui/edi-table";
import { useThemeVariables } from "@nextgisweb/gui/hook";
import { ExportIcon, ImportIcon } from "@nextgisweb/gui/icon";
import { gettext } from "@nextgisweb/pyramid/i18n";

import {
  csvRowsToCascadeOptions,
  exportCascadeOptionsToCsv,
  targetColumnsForCascadeOptions,
} from "../util/csvOptions";
import { useImportFlow } from "../util/useImportFlow";

import { OptionsEdiTableStore } from "./SimpleTableStores";
import type { OptionsRow } from "./SimpleTableStores";

/* prettier-ignore */ const
msgEdit = gettext("Edit"),
msgView = gettext("View"),
msgOptions = gettext("Options"),
msgExport = gettext("Export"),
msgImport = gettext("Import"),
msgDone = gettext("Done"),
msgDependentStub = gettext("Select or add an option in the table above to see dependent options");

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
    if (this.label === this.value) {
      this.label = value;
    }
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
  @observable.ref accessor placeholder: ParentRow | null = new ParentRow(
    this,
    {}
  );
  @observable.ref accessor readOnly: boolean = false;

  @action.bound
  setReadOnly(value: boolean) {
    this.readOnly = value;
    if (value) {
      this.placeholder = null;
    }
  }

  @action.bound
  setSelectedRowKey(val: number | undefined) {
    this.selectedRowKey = val;
  }

  @action.bound
  rotatePlaceholder() {
    if (!this.placeholder) return;

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
  reorderRow(row: ParentRow, index: number) {
    index = clamp(index, 0, this.rows.length - 1);

    const newRows = [...this.rows];
    remove(newRows, (i) => i === row);
    newRows.splice(index, 0, row);
    this.rows.replace(newRows);
  }

  get moveRow() {
    return this.readOnly ? undefined : this.reorderRow;
  }
}

interface CascadeOptionsInputProps {
  value?: ParentRow[];
  onChange?: (value: Partial<ParentRow>[]) => void;
  columns?: EdiTableColumn<ParentRow>[];
  depColumns?: EdiTableColumn<OptionsRow>[];
  readonly?: boolean;
}

export const CascadeOptionsInput = observer(
  ({
    value,
    onChange,
    columns,
    depColumns,
    readonly,
  }: CascadeOptionsInputProps) => {
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

        const selectedRowItems =
          store.rows.find((row) => row.key === store.selectedRowKey)?.items ||
          [];

        dependentStore.setColumns(["value", "label", "initial"]);
        dependentStore.setRows(
          selectedRowItems.map((i) => ({ ...i, initial: false }))
        );
        const initialDepIdx = selectedRowItems.findIndex((i) => i.initial);
        if (initialDepIdx >= 0) {
          dependentStore.rows[initialDepIdx]?.setInitial(true);
        }
      }
    }, [activeRowKey, dependentStore, store, store.rows, store.selectedRowKey]);

    const showModal = () => {
      if (value) {
        store.clear();
        const rows = value;
        store.setRows(rows);
      }

      store.setReadOnly(!!readonly);
      dependentStore.setReadOnly(!!readonly);

      store.setSelectedRowKey(undefined);
      setIsModalOpen(true);
    };

    const syncDependentToStore = useCallback(() => {
      if (store.selectedRowKey) {
        const items = dependentStore.rows.map(({ initial, value, label }) => ({
          initial,
          value,
          label: label || "",
        }));
        store.setRowItemsByKey(store.selectedRowKey, items);
      }
    }, [store, dependentStore]);

    const handleClose = () => {
      syncDependentToStore();

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

    const handleExport = useCallback(() => {
      syncDependentToStore();
      exportCascadeOptionsToCsv(
        store.rows.map((row) => ({
          value: row.value,
          label: row.label,
          initial: row.initial,
          items: row.items.map((i) => ({
            value: i.value,
            label: i.label,
            initial: i.initial ?? false,
          })),
        }))
      );
    }, [store, syncDependentToStore]);

    const handleImportData = useCallback(
      (csvRows: Record<string, string>[]) => {
        const parsed = csvRowsToCascadeOptions(csvRows);
        store.clear();
        store.setRows(
          parsed.map((r) => ({
            value: r.value,
            label: r.label,
            initial: false,
            items: observable.array<OptionSingle>(r.items),
          }))
        );
        const initialParentIdx = parsed.findIndex((r) => r.initial);
        if (initialParentIdx >= 0) {
          store.rows[initialParentIdx]?.setInitial(true);
        }
        store.setSelectedRowKey(undefined);
        setActiveRowKey(undefined);
        dependentStore.setRows([]);
      },
      [store, dependentStore]
    );

    const importFlow = useImportFlow(store.rows.length, handleImportData);

    const importerTargetColumns = targetColumnsForCascadeOptions();

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
        {importFlow.contextHolder}
        <Button style={{ width: "100%" }} onClick={showModal}>
          {readonly ? msgView : msgEdit}
        </Button>
        <ConfigProvider componentSize="middle">
          <Modal
            classNames={{
              wrapper:
                "ngw-formbuilder-editor-widget-cascade-options-input-modal",
              title:
                "ngw-formbuilder-editor-widget-cascade-options-input-modal-title",
            }}
            styles={{ body: { ...themeVariables } }}
            width="" // Do not set the default (520px) width
            centered={true}
            closeIcon={readonly ? undefined : null}
            title={
              <>
                {msgOptions}
                <Space>
                  {!readonly && (
                    <Button
                      icon={<ImportIcon />}
                      onClick={importFlow.handleClick}
                    >
                      {msgImport}
                    </Button>
                  )}
                  <Button icon={<ExportIcon />} onClick={handleExport}>
                    {msgExport}
                  </Button>
                </Space>
                {!readonly && (
                  <Button
                    className="ngw-formbuilder-editor-widget-cascade-options-input-modal-done-button"
                    type="primary"
                    onClick={handleClose}
                  >
                    {msgDone}
                  </Button>
                )}
              </>
            }
            open={isModalOpen}
            destroyOnHidden={true}
            footer={false}
            onCancel={handleClose}
          >
            <EdiTable
              size="small"
              styles={{ root: { flex: "1 0" } }}
              card={true}
              parentHeight={true}
              store={store}
              columns={columns || []}
              rowKey="key"
              rowClassName={getRowClassName}
              rowActions={readonly ? [] : undefined}
            />

            <h3>{gettext("Dependent options")}</h3>
            {store.selectedRowKey &&
            store.placeholder?.key !== store.selectedRowKey ? (
              <EdiTable
                size="small"
                card={true}
                styles={{ root: { flex: "1 0" } }}
                parentHeight={true}
                store={dependentStore}
                columns={depColumns || []}
                rowKey="key"
                rowActions={readonly ? [] : undefined}
              />
            ) : (
              <div className="dependent-stub" style={{ flex: "1 0" }}>
                {msgDependentStub}
              </div>
            )}
            <CsvImporterModal
              key={importFlow.resetCount}
              open={importFlow.isOpen}
              targetColumns={importerTargetColumns}
              onSubmit={importFlow.handleSubmit}
              close={importFlow.handleClose}
              onCancel={importFlow.handleModalOnCancel}
            />
          </Modal>
        </ConfigProvider>
      </>
    );
  }
);

CascadeOptionsInput.displayName = "CascadeOptionsInput";
