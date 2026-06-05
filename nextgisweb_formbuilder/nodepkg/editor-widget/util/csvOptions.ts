import { capitalize, uniq } from "lodash-es";
import { unparse } from "papaparse";

import type { CascadeOption } from "@nextgisweb/formbuilder/type/api";
import { downloadCsv } from "@nextgisweb/gui/util";
import { gettext } from "@nextgisweb/pyramid/i18n";

import type { OptionsRow } from "../component/SimpleTableStores";
import type { OptionsColumn } from "../element";

const msgYes = gettext("Yes");
const msgGroup = gettext("Group");
const msgValue = gettext("Value");
const msgLabel = gettext("Label");
const msgInitial = gettext("Initial");

function boolToStr(value: boolean | undefined): string {
  return value ? msgYes : "";
}

function strToBool(value: string): boolean {
  return value.trim() !== "";
}

export function exportSimpleOptionsToCsv(
  rows: OptionsRow[],
  columns: OptionsColumn[]
): void {
  const header = columns.map((col) => col.title);
  const data = rows.map((row) =>
    columns.map((col) => {
      if (col.key === "initial") return boolToStr(row.initial);
      const val = row[col.key as keyof OptionsRow];
      return typeof val === "string" ? val : "";
    })
  );
  const csv = unparse([header, ...data], { header: false });
  downloadCsv(csv);
}

export function targetColumnsForSimpleOptions(columns: OptionsColumn[]) {
  return columns.map((col) => ({
    key: col.key,
    label: col.title,
    aliases: uniq([capitalize(col.key), col.title]),
  }));
}

export function csvRowsToSimpleOptions(
  rows: Record<string, string>[],
  columnKeys: string[]
): Partial<OptionsRow>[] {
  let initialSet = false;
  const result = rows.map((row) => {
    const r: Partial<OptionsRow> = {};
    for (const key of columnKeys) {
      if (key === "initial") {
        const wants = strToBool(row[key] ?? "");
        const initial = wants && !initialSet;
        if (initial) initialSet = true;
        r.initial = initial;
      } else {
        (r as Record<string, string>)[key] = row[key] ?? "";
      }
    }
    return r;
  });
  if (columnKeys.includes("initial") && !initialSet && result.length > 0) {
    result[0].initial = true;
  }
  return result;
}

export function exportCascadeOptionsToCsv(parentRows: CascadeOption[]): void {
  const header = [msgGroup, msgValue, msgLabel, msgInitial];
  const data: string[][] = [];
  for (const parent of parentRows) {
    data.push([
      boolToStr(true),
      parent.value,
      parent.label,
      boolToStr(parent.initial),
    ]);
    for (const child of parent.items) {
      data.push([
        boolToStr(false),
        child.value,
        child.label,
        boolToStr(child.initial),
      ]);
    }
  }
  const csv = unparse([header, ...data], { header: false });
  downloadCsv(csv);
}

export function targetColumnsForCascadeOptions() {
  return [
    { key: "group", label: msgGroup, aliases: uniq(["Group", msgGroup]) },
    { key: "value", label: msgValue, aliases: uniq(["Value", msgValue]) },
    { key: "label", label: msgLabel, aliases: uniq(["Label", msgLabel]) },
    {
      key: "initial",
      label: msgInitial,
      aliases: uniq(["Initial", msgInitial]),
    },
  ];
}

export function csvRowsToCascadeOptions(
  rows: Record<string, string>[]
): CascadeOption[] {
  const parents: CascadeOption[] = [];
  let currentParent: CascadeOption | null = null;
  let parentInitialSet = false;
  let childInitialSet = false;

  const anyGroupSet = rows.some((row) => strToBool(row["group"] ?? ""));

  for (const row of rows) {
    const isParent = anyGroupSet ? strToBool(row["group"] ?? "") : true;
    if (isParent) {
      childInitialSet = false;
      const wants = strToBool(row["initial"] ?? "");
      const initial = wants && !parentInitialSet;
      if (initial) parentInitialSet = true;
      currentParent = {
        value: row["value"] ?? "",
        label: row["label"] ?? "",
        initial,
        items: [],
      };
      parents.push(currentParent);
    } else if (currentParent) {
      const wants = strToBool(row["initial"] ?? "");
      const initial = wants && !childInitialSet;
      if (initial) childInitialSet = true;
      currentParent.items.push({
        value: row["value"] ?? "",
        label: row["label"] ?? "",
        initial,
      });
    }
  }

  if (parents.length > 0 && !parentInitialSet) {
    parents[0].initial = true;
  }

  for (const parent of parents) {
    if (parent.items.length > 0 && !parent.items.some((i) => i.initial)) {
      parent.items[0].initial = true;
    }
  }

  return parents;
}
