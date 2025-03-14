import { action, computed, observable } from "mobx";

import type { FileMeta } from "@nextgisweb/file-upload/file-uploader";
import type {
    FormbuilderFormCreate,
    FormbuilderFormRead,
    FormbuilderFormUpdate,
} from "@nextgisweb/formbuilder/type/api";
import type { CompositeStore } from "@nextgisweb/resource/composite/CompositeStore";
import type {
    EditorStore,
    EditorStoreOptions,
} from "@nextgisweb/resource/type";

export class FormStore
    implements
        EditorStore<
            FormbuilderFormRead,
            FormbuilderFormUpdate,
            FormbuilderFormCreate
        >
{
    readonly identity = "formbuilder_form";
    readonly composite: CompositeStore;

    @observable.ref accessor file_upload: FileMeta | undefined = undefined;
    @observable.ref accessor uploading: boolean = false;

    constructor({ composite }: EditorStoreOptions) {
        this.composite = composite;
    }

    @action
    load() {}

    dump() {
        const result: FormbuilderFormUpdate = {};
        if (this.file_upload) {
            result.file_upload = this.file_upload;
        }
        return result;
    }

    @computed
    get isValid() {
        return (
            !this.uploading &&
            (this.composite.operation === "update" || !!this.file_upload)
        );
    }

    @computed
    get dirty() {
        return this.uploading || !!this.file_upload;
    }

    @computed
    get suggestedDisplayName() {
        const base = this.file_upload?.name;
        return base ? base.replace(/\.ngfp$/i, "") : undefined;
    }
}
