/** @plugin */
import { lazy } from "react";

import { featureEditorRegistry } from "@nextgisweb/feature-layer/feature-editor/registry";
import { route } from "@nextgisweb/pyramid/api";

const FormbuilderAttributeEditorLazy = lazy(
  () => import("./FormbuilderAttributeEditor")
);

featureEditorRegistry(COMP_ID, {
  store: () =>
    import("@nextgisweb/feature-layer/attribute-editor/AttributeEditorStore"),
  provider: async ({ parentStore, store }) => {
    const resources = await route("resource.collection").get({
      query: { parent: parentStore.resourceId },
    });

    return resources
      .filter(
        ({ resource, formbuilder_form }) =>
          resource.cls === "formbuilder_form" && formbuilder_form?.web_enabled
      )
      .map(({ resource }) => ({
        identity: `formbuilder:${resource.id}`,
        label: resource.display_name,
        order: 5,
        store,
        widget: () => (
          <FormbuilderAttributeEditorLazy formId={resource.id} store={store} />
        ),
      }));
  },
});
