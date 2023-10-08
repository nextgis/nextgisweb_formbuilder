import { makeAutoObservable, toJS } from "mobx";

export class EditorStore {
    identity = "formbuilder_form";

    file_upload = null;
    uploading = false;

    constructor({ composite, operation }) {
        makeAutoObservable(this, { identity: false });
        this.operation = operation;
        this.composite = composite;
    }

    load() {}

    dump() {
        const result = {};
        if (this.file_upload) {
            result.file_upload = this.file_upload;
        }
        return toJS(result);
    }

    get isValid() {
        return (
            !this.uploading &&
            (this.operation === "update" || !!this.file_upload)
        );
    }

    get suggestedDisplayName() {
        const base = this.file_upload?.name;
        return base ? base.replace(/\.ngfp$/i, "") : null;
    }
}
