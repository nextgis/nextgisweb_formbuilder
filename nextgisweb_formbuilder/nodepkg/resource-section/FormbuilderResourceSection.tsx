import { assert } from "@nextgisweb/jsrealm/error";
import { gettext } from "@nextgisweb/pyramid/i18n";
import type { ResourceSection } from "@nextgisweb/resource/resource-section";

import { FormbuilderEditorWidget } from "../editor-widget/FormbuilderEditorWidget";

const msgPreviewForm = gettext("Form preview");

export const FormbuilderResourceSection: ResourceSection = ({
  resourceData,
}) => {
  const formbuilderForm = resourceData.formbuilder_form;
  assert(formbuilderForm);

  return (
    <div style={{ display: "flex", height: "600px" }}>
      <FormbuilderEditorWidget
        value={formbuilderForm}
        parent={resourceData.resource.parent?.id}
        editable={false}
      />
    </div>
  );
};

FormbuilderResourceSection.displayName = "FormbuilderResourceSection";
FormbuilderResourceSection.title = msgPreviewForm;
