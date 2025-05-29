import { observer } from "mobx-react-lite";

import { InputValue, Radio } from "@nextgisweb/gui/antd";
import type { EdiTableColumnComponentProps } from "@nextgisweb/gui/edi-table";
import { gettext } from "@nextgisweb/pyramid/i18n";

import type { ParentRow } from "./CascadeOptionsInput";
import type { OptionsRow, OptionsRowStringKeys } from "./SimpleTableStores";

const msgTypeToAdd = gettext("Type here to add an option...");
const msgInitial = gettext("Initial value");

function isParentRow(row: OptionsRow | ParentRow): row is ParentRow {
    return typeof (row as ParentRow).store?.setSelectedRowKey === "function";
}

export const OptionsInputInitialValue = observer<
    EdiTableColumnComponentProps<OptionsRow | ParentRow>
>(({ placeholder, row }) => (
    <div
        style={{ display: "flex" }}
        onClick={() => {
            if (isParentRow(row)) {
                row.store.setSelectedRowKey(row.key);
            }
        }}
    >
        {!placeholder && (
            <Radio
                style={{ scale: "0.8", marginInlineEnd: 0 }}
                title={msgInitial}
                checked={row.initial}
                onChange={(evt) => {
                    row.setInitial(evt.target.checked);
                }}
            />
        )}
    </div>
));

OptionsInputInitialValue.displayName = "OptionsInputInitialValue";

export const OptionsInputValueValue = observer<
    EdiTableColumnComponentProps<OptionsRow | ParentRow>
>(({ placeholder, placeholderRef, row }) => (
    <div style={{ display: "flex" }}>
        <InputValue
            ref={placeholderRef}
            variant="borderless"
            style={{ flexGrow: 1 }}
            value={row.value}
            placeholder={placeholder ? msgTypeToAdd : undefined}
            onChange={row.setValue}
            onFocus={() => {
                if (isParentRow(row)) {
                    row.store.setSelectedRowKey(row.key);
                }
            }}
        />
    </div>
));

OptionsInputValueValue.displayName = "OptionsInputValueValue";

export const OptionsInputValueStringProp = observer<
    Omit<EdiTableColumnComponentProps<OptionsRow>, "value"> & {
        columnKey: OptionsRowStringKeys;
    }
>(({ row, columnKey }) => (
    <InputValue
        variant="borderless"
        value={row[columnKey]}
        onChange={(val) => row.setStringProp(columnKey, val)}
        style={{ flexGrow: 1 }}
        onFocus={() => {
            if (isParentRow(row)) {
                row.store.setSelectedRowKey(row.key);
            }
        }}
    />
));

OptionsInputValueStringProp.displayName = "OptionsInputValueStringProp";
