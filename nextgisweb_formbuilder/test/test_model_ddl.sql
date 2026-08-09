/*** Table: formbuilder_form ***/

CREATE TABLE formbuilder_form (
    id integer NOT NULL,
    value jsonb,
    ngfp_fileobj_id integer,
    PRIMARY KEY (id),
    CHECK ((
        value IS NULL
    ) <> (
        ngfp_fileobj_id IS NULL
    )),
    FOREIGN KEY (id) REFERENCES resource (id),
    FOREIGN KEY (ngfp_fileobj_id) REFERENCES fileobj (id)
);

COMMENT ON TABLE formbuilder_form IS 'formbuilder';
