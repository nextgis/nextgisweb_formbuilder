import { observer } from "mobx-react-lite";

import { FileUploader } from "@nextgisweb/file-upload/file-uploader";
import i18n from "@nextgisweb/pyramid/i18n";

import "./EditorWidget.less";

const uploaderMessages = {
    uploadText: i18n.gettext("Select a dataset"),
    helpText: i18n.gettext("Dataset should be in NGFP format."),
};

export const EditorWidget = observer(({ store }) => {
    return (
        <div className="ngw-formbuilder-editor-widget">
            <div>
                <FileUploader
                    onChange={(value) => {
                        store.source = value;
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

EditorWidget.title = i18n.gettext("Form");
EditorWidget.activateOn = { create: true };
EditorWidget.order = -50;
