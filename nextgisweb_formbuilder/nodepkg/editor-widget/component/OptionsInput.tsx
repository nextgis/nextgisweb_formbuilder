import { observer } from "mobx-react-lite";
import { useCallback, useState } from "react";

import { Button, ConfigProvider, Modal, Space } from "@nextgisweb/gui/antd";
import { CsvImporterModal } from "@nextgisweb/gui/csv-importer";
import { EdiTable } from "@nextgisweb/gui/edi-table";
import { ExportIcon, ImportIcon } from "@nextgisweb/gui/icon";
import { gettext } from "@nextgisweb/pyramid/i18n";

import type { OptionsColumn } from "../element";
import {
  csvRowsToSimpleOptions,
  exportSimpleOptionsToCsv,
  targetColumnsForSimpleOptions,
} from "../util/csvOptions";
import { useImportFlow } from "../util/useImportFlow";

import { OptionsEdiTableStore } from "./SimpleTableStores";
import type { OptionsRow } from "./SimpleTableStores";

import "./OptionsInput.less";

/* prettier-ignore */ const
msgEdit = gettext("Edit"),
msgOptions = gettext("Options"),
msgExport = gettext("Export"),
msgImport = gettext("Import"),
msgDone = gettext("Done");

interface OptionsInputProps {
  value?: OptionsRow[];
  onChange?: (value: Partial<OptionsRow>[]) => void;
  columns?: OptionsColumn[];
}

export const OptionsInput = observer(
  ({ value, onChange, columns }: OptionsInputProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [store] = useState(() => new OptionsEdiTableStore());

    const handleOpen = () => {
      const columnKeys = columns?.map((col) => col.key) || [];
      store.setColumns(columnKeys);
      if (value) {
        store.setRows(value);
      }
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

    const importFlow = useImportFlow(store.rows.length, handleImportData);

    const importerTargetColumns = columns
      ? targetColumnsForSimpleOptions(columns)
      : [];

    return (
      <>
        {importFlow.contextHolder}
        <Button style={{ width: "100%" }} onClick={handleOpen}>
          {msgEdit}
        </Button>
        <ConfigProvider componentSize={"medium"}>
          <Modal
            classNames={{
              wrapper: "ngw-formbuilder-editor-widget-options-input-modal",
              title: "ngw-formbuilder-editor-widget-options-input-modal-title",
            }}
            width="" // Do not set the default (520px) width
            centered={true}
            closeIcon={null}
            title={
              <>
                {msgOptions}
                <Space>
                  <Button
                    icon={<ImportIcon />}
                    onClick={importFlow.handleClick}
                  >
                    {msgImport}
                  </Button>
                  <Button icon={<ExportIcon />} onClick={handleExport}>
                    {msgExport}
                  </Button>
                </Space>
                <Button
                  className="ngw-formbuilder-editor-widget-options-input-modal-done-button"
                  type="primary"
                  onClick={handleClose}
                >
                  {msgDone}
                </Button>
              </>
            }
            open={isModalOpen}
            destroyOnHidden={true}
            footer={false}
            onOk={handleClose}
            onCancel={handleClose}
          >
            <EdiTable
              size="small"
              card={true}
              parentHeight={true}
              store={store}
              columns={columns || []}
              rowKey="key"
            />
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

OptionsInput.displayName = "OptionsInput";
