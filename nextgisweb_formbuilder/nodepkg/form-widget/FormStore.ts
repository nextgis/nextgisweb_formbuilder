import { action, computed, observable } from "mobx";

import type { FeaureLayerGeometryType } from "@nextgisweb/feature-layer/type/api";
import type { FileMeta } from "@nextgisweb/file-upload/file-uploader";
import type {
    FormbuilderFormCreate,
    FormbuilderFormItem,
    FormbuilderFormRead,
    FormbuilderFormUpdate,
    FormbuilderTabsItem,
} from "@nextgisweb/formbuilder/type/api";
import type { CompositeStore } from "@nextgisweb/resource/composite/CompositeStore";
import type {
    EditorStore,
    EditorStoreOptions,
} from "@nextgisweb/resource/type";

import type { FormbuilderEditorField } from "../editor-widget/FormbuilderEditorStore";

export type Mode = "file" | "input";

export type EditorData = {
    geometryType: FeaureLayerGeometryType;
    fields: FormbuilderEditorField[];
    items: Array<FormbuilderTabsItem | FormbuilderFormItem>;
    updateFeatureLayerFields: boolean;
};

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

    @observable.ref accessor mode: Mode = "input";
    @observable.ref accessor file_upload: FileMeta | undefined = undefined;
    @observable.ref accessor uploading: boolean = false;

    @observable.ref accessor dirty: boolean = false;

    @observable.ref accessor editorData: EditorData | undefined = undefined;
    @observable.ref accessor initEditorData: EditorData | undefined = undefined;

    constructor({ composite }: EditorStoreOptions) {
        this.composite = composite;
    }

    @action
    load(val: any) {
        this.initEditorData = val;
        this.mode = val.value ? "input" : "file";
    }

    dump() {
        const result: Partial<FormbuilderFormUpdate> = {};
        if (this.mode === "file") {
            if (this.file_upload) {
                result.file_upload = this.file_upload;
            }
        } else if (this.mode === "input") {
            result.value = {
                geometry_type:
                    this.editorData?.geometryType ||
                    ("POINT" as FeaureLayerGeometryType),
                fields: this.editorData?.fields || [],
                items: this.editorData?.items || [],
            };

            result.update_feature_layer_fields =
                this.editorData?.updateFeatureLayerFields;
        }
        return result;
    }

    @action.bound
    setMode(mode: Mode) {
        this.mode = mode;
    }

    @action.bound
    setDirty(val: boolean) {
        this.dirty = val;
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
    get suggestedDisplayName() {
        const base = this.file_upload?.name;
        return base ? base.replace(/\.ngfp$/i, "") : undefined;
    }
}
