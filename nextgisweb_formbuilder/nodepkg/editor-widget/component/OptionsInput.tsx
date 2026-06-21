import { observer } from "mobx-react-lite";
import { useCallback, useState } from "react";

import { Button } from "@nextgisweb/gui/antd";
import { EdiTable } from "@nextgisweb/gui/edi-table";
import { gettext } from "@nextgisweb/pyramid/i18n";

import type { OptionsColumn } from "../element";
import {
  csvRowsToSimpleOptions,
  exportSimpleOptionsToCsv,
  targetColumnsForSimpleOptions,
} from "../util/csvOptions";

import { OptionsModal } from "./OptionsModal";
import { OptionsEdiTableStore } from "./SimpleTableStores";
import type { OptionsRow } from "./SimpleTableStores";

/* prettier-ignore */ const
msgEdit = gettext("Edit"),
msgView = gettext("View");

interface OptionsInputProps {
  value?: OptionsRow[];
  onChange?: (value: Partial<OptionsRow>[]) => void;
  columns?: OptionsColumn[];
  readonly?: boolean;
}

export const OptionsInput = observer(
  ({ value, onChange, columns, readonly }: OptionsInputProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [store] = useState(() => new OptionsEdiTableStore());

    const handleOpen = () => {
      const columnKeys = columns?.map((col) => col.key) || [];
      store.setColumns(columnKeys);
      if (value) {
        store.setRows(value);
      }
      store.setReadOnly(!!readonly);
      setIsModalOpen(true);
    };

    const handleClose = () => {
      if (onChange) {
        onChange(
          store.rows.map(({ initial, value, label, first, second }) => ({
            initial,
            value,
            label,
            first,
            second,
          }))
        );
      }
      setIsModalOpen(false);
    };

    const handleExport = useCallback(() => {
      if (columns) {
        exportSimpleOptionsToCsv(store.rows, columns);
      }
    }, [store.rows, columns]);

    const handleImportData = useCallback(
      (rows: Record<string, string>[]) => {
        const columnKeys = columns?.map((col) => col.key) || [];
        store.setColumns(columnKeys);
        const parsed = csvRowsToSimpleOptions(rows, columnKeys);
        store.setRows(parsed.map((r) => ({ ...r, initial: false })));
        if (columnKeys.includes("initial")) {
          const initialIdx = parsed.findIndex((r) => r.initial);
          if (initialIdx >= 0) {
            store.rows[initialIdx]?.setInitial(true);
          }
        }
      },
      [store, columns]
    );

    const importerTargetColumns = columns
      ? targetColumnsForSimpleOptions(columns)
      : [];

    return (
      <>
        <Button style={{ width: "100%" }} onClick={handleOpen}>
          {readonly ? msgView : msgEdit}
        </Button>
        <OptionsModal
          open={isModalOpen}
          readonly={readonly}
          rowsCount={store.rows.length}
          importerTargetColumns={importerTargetColumns}
          onImportData={handleImportData}
          onExport={handleExport}
          onClose={handleClose}
        >
          <EdiTable
            size="small"
            card={true}
            parentHeight={true}
            store={store}
            columns={columns || []}
            rowKey="key"
            rowActions={readonly ? [] : undefined}
          />
        </OptionsModal>
      </>
    );
  }
);

OptionsInput.displayName = "OptionsInput";
