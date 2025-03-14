import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";

import { FileUploader } from "@nextgisweb/file-upload/file-uploader";
import { gettext } from "@nextgisweb/pyramid/i18n";
import type { EditorWidget } from "@nextgisweb/resource/type";

import type { FormStore } from "./FormStore";
import "./FormWidget.less";

const uploaderMessages = {
    uploadText: gettext("Select a dataset"),
    helpText: gettext("Dataset should be in NGFP format."),
};

export const FormWidget: EditorWidget<FormStore> = observer(({ store }) => {
    return (
        <div className="ngw-formbuilder-form-widget">
            <div>
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
            </div>
        </div>
    );
});

FormWidget.displayName = "FormWidget";
FormWidget.title = gettext("Form");
FormWidget.activateOn = { create: true };
FormWidget.order = -50;
