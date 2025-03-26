/*** {
    "revision": "4a8a1f37", "parents": ["00000000"],
    "date": "2025-03-11T07:38:14",
    "message": "NGFP struct value"
} ***/

ALTER TABLE formbuilder_form ADD COLUMN value jsonb;
ALTER TABLE formbuilder_form ADD CONSTRAINT formbuilder_form_check
    CHECK ((value IS NULL) <> (ngfp_fileobj_id IS NULL));
