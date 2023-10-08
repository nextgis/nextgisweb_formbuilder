import { observer } from "mobx-react-lite";

import { FileUploader } from "@nextgisweb/file-upload/file-uploader";
import { gettext } from "@nextgisweb/pyramid/i18n";

import "./EditorWidget.less";

const uploaderMessages = {
    uploadText: gettext("Select a dataset"),
    helpText: gettext("Dataset should be in NGFP format."),
};

export const EditorWidget = observer(({ store }) => {
    return (
        <div className="ngw-formbuilder-editor-widget">
            <div>
                <FileUploader
                    onChange={(value) => {
                        store.file_upload = value;
                    }}
                    onUploading={(value) => {
                        store.uploading = value;
                    }}
                    showMaxSize
                    {...uploaderMessages}
                />
            </div>
        </div>
    );
});

EditorWidget.title = gettext("Form");
EditorWidget.activateOn = { create: true };
EditorWidget.order = -50;
