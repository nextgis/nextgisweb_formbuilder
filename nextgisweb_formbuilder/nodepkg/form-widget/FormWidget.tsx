import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";

import { FileUploader } from "@nextgisweb/file-upload/file-uploader";
import { Select, Tooltip } from "@nextgisweb/gui/antd";
import { errorModal } from "@nextgisweb/gui/error";
import { route } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";
import type { EditorWidget } from "@nextgisweb/resource/type";

import FormbuilderEditorWidget from "../editor-widget/FormbuilderEditorWidget";
import { isFieldOccupied } from "../editor-widget/util/fieldRelatedOperations";
import { serializeData } from "../editor-widget/util/serializeData";

import type { FormStore } from "./FormStore";

import ExperimentalIcon from "@nextgisweb/icon/material/science";

import "./FormWidget.less";

const msgUploadForm = gettext("Upload form");
const msgDesingForm = gettext("Design form");

const msgUploader = {
    uploadText: gettext("Select a form file"),
    helpText: gettext("It should be in NGFP format."),
};

const msgExperimental = gettext(
    "Form designer is currently in an early beta stage. Use it with caution!"
);

const modeOptions = [
    {
        value: "file",
        label: msgUploadForm,
    },
    {
        value: "input",
        label: (
            <>
                {msgDesingForm + " "}
                <Tooltip title={msgExperimental}>
                    <ExperimentalIcon />
                </Tooltip>
            </>
        ),
    },
];

export const FormWidget: EditorWidget<FormStore> = observer(({ store }) => {
    const { mode } = store;

    const [switchModeCounter, setSwitchModeCounter] = useState(0);

    const handleModeChange = async (mode: "file" | "input") => {
        const resourceId = store.composite.resourceId;
        const { editorData } = store;

        if (resourceId && switchModeCounter < 1) {
            try {
                const resourceData = await route(
                    "formbuilder.formbuilder_form_convert"
                ).post({ json: { resource: { id: resourceId } } });

                store.load({ value: resourceData });
                setSwitchModeCounter(switchModeCounter + 1);
            } catch (error: any) {
                errorModal(error);
                return; // Abort switching mode
            }
            setSwitchModeCounter(switchModeCounter + 1);
        }

        if (switchModeCounter > 0) {
            store.load({ value: editorData });
        }

        store.setMode(mode);
    };

    const modeComponent = useMemo(() => {
        switch (mode) {
            case "file":
                return (
                    <FileUploader
                        onChange={(value) => {
                            runInAction(() => {
                                store.file_upload = value;
                                store.setDirty(true);
                            });
                        }}
                        onUploading={(value) => {
                            runInAction(() => {
                                store.uploading = value;
                            });
                        }}
                        {...msgUploader}
                    />
                );
            case "input":
                return (
                    <FormbuilderEditorWidget
                        value={store.initEditorData}
                        parent={store.composite.parent}
                        setDirty={store.setDirty}
                        onChange={(val) => {
                            runInAction(() => {
                                const usedFields = val.fields.filter((field) =>
                                    isFieldOccupied(field.keyname, val.tree)
                                );

                                store.editorData = {
                                    geometryType: val.geometryType,
                                    fields: usedFields,
                                    items: serializeData(val.tree),
                                    updateFeatureLayerFields:
                                        val.updateFeatureLayerFields,
                                };
                            });
                        }}
                    />
                );
        }
    }, [store, mode]);

    return (
        <div className="ngw-formbuilder-form-widget">
            <Select
                className="mode"
                style={{ width: "100%" }}
                options={modeOptions}
                value={store.mode}
                onChange={handleModeChange}
            />
            {modeComponent}
        </div>
    );
});

FormWidget.displayName = "FormWidget";
FormWidget.title = gettext("Form");
FormWidget.activateOn = { create: true, update: true };
FormWidget.order = -50;
