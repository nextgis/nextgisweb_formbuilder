import type { ReactNode } from "react";

import {
  Button,
  ConfigProvider,
  Dropdown,
  Modal,
  Space,
} from "@nextgisweb/gui/antd";
import type { MenuProps } from "@nextgisweb/gui/antd";
import { CsvImporterModal } from "@nextgisweb/gui/csv-importer";
import type { TargetColumn } from "@nextgisweb/gui/csv-importer";
import { useThemeVariables } from "@nextgisweb/gui/hook";
import { ExportIcon, ImportIcon } from "@nextgisweb/gui/icon";
import { lookupTableLoadItems } from "@nextgisweb/lookup-table/util/sort";
import { route } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { showResourcePicker } from "@nextgisweb/resource/component/resource-picker";

import { useImportFlow } from "../util/useImportFlow";

import "./OptionsModal.less";

/* prettier-ignore */ const
msgOptions = gettext("Options"),
msgExport = gettext("Export"),
msgImport = gettext("Import"),
msgImportFromFile = gettext("From file"),
msgImportFromLookup = gettext("From lookup table"),
msgDone = gettext("Done");

const importFromFileKey = "from-file";
const importFromLookupKey = "from-lookup";

interface OptionsModalProps {
  open: boolean;
  readonly?: boolean;
  rowsCount: number;
  importerTargetColumns: TargetColumn[];
  onImportData: (rows: Record<string, string>[]) => void;
  onExport: () => void;
  onClose: () => void;
  children: ReactNode;
}

export function OptionsModal({
  open,
  readonly,
  rowsCount,
  importerTargetColumns,
  onImportData,
  onExport,
  onClose,
  children,
}: OptionsModalProps) {
  const importFlow = useImportFlow(rowsCount, onImportData);

  const handleImportFromLookup = async () => {
    if (!(await importFlow.confirmReplace())) return;
    const structuralKeys = ["value", "initial", "group"];
    const labelKey = importerTargetColumns.find(
      (column) => !structuralKeys.includes(column.key)
    )?.key;
    showResourcePicker<number>({
      pickerOptions: { requireClass: "lookup_table" },
      onSelect: async (resourceId) => {
        const item = await route("resource.item", resourceId).get();
        const lookupTable = item.lookup_table;
        if (!lookupTable) return;
        onImportData(
          lookupTableLoadItems(lookupTable).map(({ key, value }) => ({
            value: key,
            ...(labelKey ? { [labelKey]: value } : {}),
          }))
        );
      },
    });
  };

  const importMenu: MenuProps = {
    items: [
      { key: importFromFileKey, label: msgImportFromFile },
      { key: importFromLookupKey, label: msgImportFromLookup },
    ],
    onClick: ({ key }) => {
      if (key === importFromFileKey) {
        importFlow.handleClick();
      } else if (key === importFromLookupKey) {
        handleImportFromLookup();
      }
    },
  };

  const themeVariables = useThemeVariables({
    "border-radius": "borderRadius",
    "color-border-secondary": "colorBorderSecondary",
    "color-text-quaternary": "colorTextQuaternary",
  });

  return (
    <ConfigProvider componentSize="middle">
      {importFlow.contextHolder}
      <Modal
        classNames={{
          wrapper: "ngw-formbuilder-editor-widget-options-modal",
          title: "ngw-formbuilder-editor-widget-options-modal-title",
        }}
        styles={{ body: themeVariables }}
        width=""
        centered={true}
        closeIcon={readonly ? undefined : null}
        title={
          <>
            {msgOptions}
            <Space>
              {!readonly && (
                <Dropdown menu={importMenu} trigger={["click"]}>
                  <Button icon={<ImportIcon />}>{msgImport}</Button>
                </Dropdown>
              )}
              <Button icon={<ExportIcon />} onClick={onExport}>
                {msgExport}
              </Button>
            </Space>
            {!readonly && (
              <Button
                className="ngw-formbuilder-editor-widget-options-modal-done-button"
                type="primary"
                onClick={onClose}
              >
                {msgDone}
              </Button>
            )}
          </>
        }
        open={open}
        destroyOnHidden={true}
        footer={false}
        onCancel={onClose}
      >
        {children}
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
  );
}

OptionsModal.displayName = "OptionsModal";
