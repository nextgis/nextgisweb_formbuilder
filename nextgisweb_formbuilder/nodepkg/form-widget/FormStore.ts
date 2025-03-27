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

export type Mode = "file" | "input";

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

    @observable.ref accessor mode: Mode = "file";
    @observable.ref accessor file_upload: FileMeta | undefined = undefined;
    @observable.ref accessor uploading: boolean = false;

    @observable.ref accessor editorData: any = null;
    @observable.ref accessor initEditorData: any = null;

    constructor({ composite }: EditorStoreOptions) {
        this.composite = composite;
    }

    @action
    load(val: any) {
        this.initEditorData = val;
        this.mode = val.value ? "input" : "file";
    }

    dump() {
        const result: FormbuilderFormUpdate = {};
        if (this.mode === "file") {
            if (this.file_upload) {
                result.file_upload = this.file_upload;
            }
        } else if (this.mode === "input") {
            result.value = this.editorData;
        }
        return result;
    }

    @action.bound
    setMode(mode: Mode) {
        this.mode = mode;
    }

    @computed
    get isValid() {
        if (this.editorData) {
            return true;
        } else {
            return (
                !this.uploading &&
                (this.composite.operation === "update" || !!this.file_upload)
            );
        }
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
