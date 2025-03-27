/** @testentry react */
import { useState } from "react";

import { Button } from "@nextgisweb/gui/antd";
import { Code } from "@nextgisweb/gui/component/code";

import { FormbuilderEditorStore } from "./FormbuilderEditorStore";
import EditorWidget from "./FormbuilderEditorWidget";
import { serializeData } from "./util/serializeData";

function FormbuilderTest() {
    const [json, setJson] = useState("");
    const [fields, setFields] = useState("");

    const [store] = useState(() => {
        return new FormbuilderEditorStore();
    });

    const handleTest = () => {
        const result = JSON.stringify(
            serializeData(store.inputsTree),
            null,
            ` `
        );

        setJson(result);
    };

    const handleTestFields = () => {
        const result = JSON.stringify(store.fields, null, ` `);

        setFields(result);
    };

    return (
        <>
            <EditorWidget store={store} />
            <br />

            <div style={{ display: "flex" }}>
                <div style={{ width: "60%" }}>
                    <h4 style={{ marginBottom: "6px" }}>form.json</h4>
                    <Button
                        style={{ marginBottom: "6px" }}
                        onClick={handleTest}
                    >
                        Test output of form.json
                    </Button>
                    <Code lang="json" value={json} />
                </div>
                <div style={{ width: "40%" }}>
                    <h4 style={{ marginBottom: "6px" }}>fields data</h4>
                    <Button
                        style={{ marginBottom: "6px" }}
                        onClick={handleTestFields}
                    >
                        Test output of fields data
                    </Button>
                    <Code lang="json" value={fields} />
                </div>
            </div>
        </>
    );
}

export default FormbuilderTest;
