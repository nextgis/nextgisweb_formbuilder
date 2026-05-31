import { observer } from "mobx-react-lite";
import { useState } from "react";

import { Button, Modal } from "@nextgisweb/gui/antd";
import { EdiTable } from "@nextgisweb/gui/edi-table";
import { gettext } from "@nextgisweb/pyramid/i18n";

import type { OptionsColumn } from "../element";

import { OptionsEdiTableStore } from "./SimpleTableStores";
import type { OptionsRow } from "./SimpleTableStores";

import "./OptionsInput.less";

const msgEdit = gettext("Edit");
const msgOptions = gettext("Options");

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
      if (value) {
        store.setColumns(columns?.map((col) => col.key) || []);
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

    return (
      <>
        <Button style={{ width: "100%" }} onClick={handleOpen}>
          {msgEdit}
        </Button>
        <Modal
          className="ngw-formbuilder-editor-widget-options-input-modal"
          width="" // Do not set the default (520px) width
          centered={true}
          title={msgOptions}
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
        </Modal>
      </>
    );
  }
);

OptionsInput.displayName = "OptionsInput";
