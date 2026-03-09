/** @plugin */
import { route } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { registerResourceAction } from "@nextgisweb/resource/resource-section/registry";

import ExportIcon from "@nextgisweb/icon/material/download";

registerResourceAction(COMP_ID, {
  key: "ngfp",
  icon: <ExportIcon />,
  label: gettext("Download as NGFP"),
  menu: { group: "extra" },
  condition: (it) => {
    return it.get("resource.cls") === "formbuilder_form";
  },
  href: (it) => route("formbuilder.formbuilder_form_ngfp", it.id).url(),
});
