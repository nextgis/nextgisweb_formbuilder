import { action, computed } from "mobx";

import type { FormbuilderFormRead } from "@nextgisweb/formbuilder/type/api";
import { mapper } from "@nextgisweb/gui/arm";
import type { EditorStore } from "@nextgisweb/resource/type";

type Value = Pick<FormbuilderFormRead, "web_enabled">;

const {
  web_enabled,
  $load: load,
  $dirty: dirty,
  $error: error,
} = mapper<SettingsStore, Value>();

export class SettingsStore implements EditorStore<Value> {
  readonly identity = "formbuilder_form";

  readonly webEnabled = web_enabled.init(false, this);

  @action
  load(value: Value) {
    load(this, value);
  }

  dump(): Value | undefined {
    if (!this.dirty) return undefined;
    return this.webEnabled.jsonPart();
  }

  @computed
  get dirty(): boolean {
    return dirty(this);
  }

  @computed
  get isValid(): boolean {
    return error(this) === false;
  }
}
