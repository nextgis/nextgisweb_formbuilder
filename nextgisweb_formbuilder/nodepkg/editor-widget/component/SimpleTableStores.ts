import { clamp, remove } from "lodash-es";
import { actionBound, observable, observableRef } from "mobx";

import type { EdiTableStore } from "@nextgisweb/gui/edi-table";

export type OptionsRowStringKeys = {
  [K in keyof OptionsRow]: OptionsRow[K] extends string | undefined
    ? K
    : OptionsRow[K] extends string
      ? K
      : never;
}[keyof OptionsRow];

export class OptionsRow {
  private static keySeq = 0;
  readonly key = ++OptionsRow.keySeq;
  readonly store: OptionsEdiTableStore;

  @observableRef accessor initial: boolean = false;
  @observableRef accessor value: string = "";
  @observableRef accessor label: string | undefined = undefined;
  @observableRef accessor first: string | undefined = undefined;
  @observableRef accessor second: string | undefined = undefined;

  constructor(store: OptionsEdiTableStore, data: Partial<OptionsRow> = {}) {
    this.store = store;
    Object.assign(this, data);
  }

  @actionBound
  setStringProp(prop: OptionsRowStringKeys, value: string) {
    (this[prop] as string) = value;
  }

  @actionBound
  setValue(value: string) {
    for (const col of this.store.columns) {
      if (col === "label" || col === "first" || col === "second") {
        if (this[col] === this.value || this[col] === undefined) {
          this[col] = value;
        }
      }
    }
    this.value = value;
    if (this === this.store.placeholder) {
      this.store.rotatePlaceholder();
    }
  }

  @actionBound
  setInitial(value: boolean) {
    this.initial = value;
    for (const row of this.store.rows) {
      if (row !== this) {
        row.initial = false;
      }
    }
  }
}

export class OptionsEdiTableStore implements EdiTableStore<OptionsRow> {
  readonly rows = observable.array<OptionsRow>();

  @observableRef accessor columns: string[] = [];
  @observableRef accessor placeholder: OptionsRow | null = new OptionsRow(
    this,
    {}
  );
  @observableRef accessor readOnly: boolean = false;

  @actionBound
  setReadOnly(value: boolean) {
    this.readOnly = value;
    if (value) {
      this.placeholder = null;
    }
  }

  @actionBound
  rotatePlaceholder() {
    if (!this.placeholder) return;

    this.rows.push(this.placeholder);

    if (this.rows.length === 1) {
      this.rows[0].setInitial(true);
    }

    this.placeholder = new OptionsRow(this, {});
  }

  @actionBound
  addRow(data: Partial<OptionsRow>) {
    this.rows.push(new OptionsRow(this, data));
  }

  @actionBound
  setColumns(columns: string[]) {
    this.columns = columns;
  }

  @actionBound
  setRows(data: Partial<OptionsRow>[]) {
    this.rows.replace(data.map((r) => new OptionsRow(this, r)));
  }

  @actionBound
  cloneRow(row: OptionsRow) {
    this.rows.splice(
      this.rows.indexOf(row) + 1,
      0,
      new OptionsRow(this, {
        value: row.value,
        label: row.label,
        first: row.first,
        second: row.second,
      })
    );
  }

  @actionBound
  deleteRow(row: OptionsRow) {
    this.rows.remove(row);
  }

  @actionBound
  reorderRow(row: OptionsRow, index: number) {
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
