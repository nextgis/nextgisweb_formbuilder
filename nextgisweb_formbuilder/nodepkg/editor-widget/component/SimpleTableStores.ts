import { clamp, remove } from "lodash-es";
import { action, observable } from "mobx";

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

  @observable.ref accessor initial: boolean = false;
  @observable.ref accessor value: string = "";
  @observable.ref accessor label: string | undefined = undefined;
  @observable.ref accessor first: string | undefined = undefined;
  @observable.ref accessor second: string | undefined = undefined;

  constructor(store: OptionsEdiTableStore, data: Partial<OptionsRow> = {}) {
    this.store = store;
    Object.assign(this, data);
  }

  @action.bound
  setStringProp(prop: OptionsRowStringKeys, value: string) {
    (this[prop] as string) = value;
  }

  @action.bound
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

export class OptionsEdiTableStore implements EdiTableStore<OptionsRow> {
  readonly rows = observable.array<OptionsRow>();

  @observable.ref accessor columns: string[] = [];
  @observable.ref accessor placeholder = new OptionsRow(this, {});

  @action.bound
  rotatePlaceholder() {
    this.rows.push(this.placeholder);

    if (this.rows.length === 1) {
      this.rows[0].setInitial(true);
    }

    this.placeholder = new OptionsRow(this, {});
  }

  @action.bound
  addRow(data: Partial<OptionsRow>) {
    this.rows.push(new OptionsRow(this, data));
  }

  @action.bound
  setColumns(columns: string[]) {
    this.columns = columns;
  }

  @action.bound
  setRows(data: Partial<OptionsRow>[]) {
    this.rows.replace(data.map((r) => new OptionsRow(this, r)));
  }

  @action.bound
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

  @action.bound
  deleteRow(row: OptionsRow) {
    this.rows.remove(row);
  }

  @action.bound
  moveRow(row: OptionsRow, index: number) {
    index = clamp(index, 0, this.rows.length - 1);

    const newRows = [...this.rows];
    remove(newRows, (i) => i === row);
    newRows.splice(index, 0, row);
    this.rows.replace(newRows);
  }
}
