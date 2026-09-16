/*** {
    "revision": "559e7a6c", "parents": ["4d5bfd2d"],
    "date": "2026-09-15T14:26:16",
    "message": "Add web form availability"
} ***/

ALTER TABLE formbuilder_form ADD COLUMN web_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE formbuilder_form ALTER COLUMN web_enabled DROP DEFAULT;
