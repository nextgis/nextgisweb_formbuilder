import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";

import { FileUploader } from "@nextgisweb/file-upload/file-uploader";
import { Select } from "@nextgisweb/gui/antd";
import type { SelectProps } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import type { EditorWidget } from "@nextgisweb/resource/type";

import clientSettings from "../client-settings";
import FormbuilderEditorWidget from "../editor-widget/FormbuilderEditorWidget";
import {
    isFieldOccupied,
    serializeData,
} from "../editor-widget/util/serializeData";

import type { FormStore, Mode } from "./FormStore";

import "./FormWidget.less";

type Option = NonNullable<SelectProps["options"]>[0] & {
    value: Mode;
};
const uploaderMessages = {
    uploadText: gettext("Select a form file"),
    helpText: gettext("It should be in NGFP format."),
};

export const FormWidget: EditorWidget<FormStore> = observer(({ store }) => {
    const { mode } = store;

    const modeOpts = useMemo(() => {
        const result: Option[] = [
            {
                value: "file",
                label: gettext("Upload form"),
            },
        ];
        if (clientSettings.designer || mode === "input") {
            result.push({
                value: "input",
                label: gettext("Design form"),
            });
        }

        return result;
    }, [mode]);

    const modeComponent = useMemo(() => {
        switch (mode) {
            case "file":
                return (
                    <FileUploader
                        onChange={(value) => {
                            runInAction(() => {
                                store.file_upload = value;
                            });
                        }}
                        onUploading={(value) => {
                            runInAction(() => {
                                store.uploading = value;
                            });
                        }}
                        {...uploaderMessages}
                    />
                );
            case "input":
                return (
                    <FormbuilderEditorWidget
                        value={store.initEditorData}
                        parent={store.composite.parent}
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
            {modeOpts.length > 1 && (
                <Select
                    className="mode"
                    style={{ width: "100%" }}
                    options={modeOpts}
                    value={store.mode}
                    onChange={store.setMode}
                />
            )}
            {modeComponent}
        </div>
    );
});

FormWidget.displayName = "FormWidget";
FormWidget.title = gettext("Form");
FormWidget.activateOn = { create: true };
FormWidget.order = -50;
