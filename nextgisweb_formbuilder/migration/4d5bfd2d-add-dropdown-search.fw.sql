/*** {
    "revision": "4d5bfd2d", "parents": ["4a8a1f37"],
    "date": "2025-07-30T03:09:33",
    "message": "Add dropdown search"
} ***/

UPDATE formbuilder_form
SET value = replace(value::text, '"type": "dropdown"', '"type":"dropdown","search":true')::jsonb
