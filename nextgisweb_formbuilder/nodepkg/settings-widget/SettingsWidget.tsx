import { observer } from "mobx-react-lite";

import { CheckboxValue } from "@nextgisweb/gui/antd";
import { LotMV } from "@nextgisweb/gui/arm";
import { Area } from "@nextgisweb/gui/mayout";
import { gettext } from "@nextgisweb/pyramid/i18n";
import type { EditorWidget } from "@nextgisweb/resource/type";

import type { SettingsStore } from "./SettingsStore";

export const SettingsWidget: EditorWidget<SettingsStore> = observer(
  ({ store }) => (
    <Area pad>
      <LotMV
        label={false}
        value={store.webEnabled}
        component={CheckboxValue}
        props={{ children: gettext("Use form in web feature editors") }}
      />
    </Area>
  )
);

SettingsWidget.displayName = "SettingsWidget";
SettingsWidget.title = gettext("Settings");
SettingsWidget.order = 40;
