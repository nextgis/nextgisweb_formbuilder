import { makeAutoObservable, toJS } from "mobx";

export class EditorStore {
    identity = "formbuilder_form";

    source = null;
    uploading = false;

    constructor({ composite, operation }) {
        makeAutoObservable(this, { identity: false });
        this.operation = operation;
        this.composite = composite;
    }

    load(value) {}

    dump({ lunkwill }) {
        const result = {};
        if (this.source) {
            result.source = this.source;
        }

        lunkwill.suggest(this.operation === "create" || !!this.source);

        return toJS(result);
    }

    get isValid() {
        return (
            !this.uploading && (this.operation === "update" || !!this.source)
        );
    }

    get suggestedDisplayName() {
        const base = this.source?.name;
        return base ? base.replace(/\.ngfp$/i, "") : null;
    }
}
