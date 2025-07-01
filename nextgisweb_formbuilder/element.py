import re
from datetime import datetime
from typing import (
    TYPE_CHECKING,
    Annotated,
    Any,
    Callable,
    ClassVar,
    Dict,
    List,
    Literal,
    Tuple,
    Type,
    Union,
    cast,
    get_origin,
)

from msgspec import UNSET, Meta, Struct, UnsetType

from nextgisweb.env import gettextf
from nextgisweb.lib.apitype import disannotate

from nextgisweb.core.exception import ValidationError
from nextgisweb.feature_layer import FIELD_TYPE, FeatureLayerFieldDatatype
from nextgisweb.jsrealm import TSExport

DatatypeTuple = Tuple[FeatureLayerFieldDatatype, ...]
BindFieldCallback = Callable[[str, DatatypeTuple], None]


FieldKeyname = str


class FieldSpec(Struct, kw_only=True, frozen=True):
    datatypes: DatatypeTuple


class LegacySpec(Struct, kw_only=True, frozen=True):
    attr: str
    default: Any = UNSET


Remember = Annotated[bool, LegacySpec(attr="last")]


class FormbuilderItem(Struct, kw_only=True):
    registry: ClassVar[list[Type["FormbuilderItem"]]] = list()
    field_specs: ClassVar[Tuple[Tuple[str, FieldSpec], ...]]
    legacy_specs: ClassVar[Tuple[Tuple[str, LegacySpec], ...]]
    legacy_type: ClassVar[str]

    def __init_subclass__(cls, **kw):
        super().__init_subclass__(**kw)
        cls.registry.append(cls)
        field_specs = set()
        legacy_specs = set()
        for attr, tdef in cls.__annotations__.items():
            tbase, extras = disannotate(tdef)
            for extra in extras:
                if isinstance(extra, FieldSpec):
                    field_specs.add((attr, extra))
                if isinstance(extra, LegacySpec):
                    collection_cls = tbase.__args__[0] if get_origin(tbase) is list else None
                    legacy_specs.add((attr, extra, collection_cls))

        cls.field_specs = tuple(field_specs)
        cls.legacy_specs = tuple(legacy_specs)

    @classmethod
    def attrs_from_legacy(cls, li) -> Dict[str, Any]:
        attrs = dict()
        for attr, spec, collection_cls in cls.legacy_specs:
            obj = li["attributes"][spec.attr]
            if collection_cls is not None:
                obj = [collection_cls.from_legacy(i) for i in obj]
            attrs[attr] = obj
        return attrs

    @classmethod
    def from_legacy(cls, li):
        if li["type"] == "text_edit":
            if li["attributes"]["ngid_login"] or li["attributes"]["ngw_login"]:
                item_cls = FormbuilderSystemItem
            else:
                item_cls = FormbuilderTextboxItem
        else:
            for c in cls.registry:
                if c.legacy_type == li["type"]:
                    item_cls = c
                    break
            else:
                raise ValueError(f"Unknown item type {li['type']}.")

        attrs = item_cls.attrs_from_legacy(li)
        return item_cls(**attrs)

    def validate(self, *, bind_field: BindFieldCallback) -> None:
        for attr, spec in self.field_specs:
            keyname = getattr(self, attr)
            bind_field(keyname, spec.datatypes)

    def to_legacy(self) -> Dict[str, Any]:
        data: Dict[str, Any] = dict(type=self.legacy_type)
        attributes = data["attributes"] = dict()
        for attr, spec, collection_cls in self.legacy_specs:
            value = getattr(self, attr)
            if value is UNSET:
                if spec.default is UNSET:
                    continue
                value = spec.default
            attributes[spec.attr] = value
        return data


class FormbuilderLabelItem(FormbuilderItem, tag="label"):
    legacy_type = "text_label"

    label: Annotated[str, LegacySpec(attr="text")]


class FormbuilderTab(Struct):
    title: str
    active: bool
    items: List["FormbuilderFormItemUnion"]

    @classmethod
    def from_legacy(cls, li):
        items = [FormbuilderItem.from_legacy(i) for i in li["elements"]]
        return cls(
            title=li["caption"],
            active=li.get("default", False),
            items=items,
        )

    def validate(self, *, bind_field: BindFieldCallback) -> None:
        for item in self.items:
            item.validate(bind_field=bind_field)

    def to_legacy(self) -> Dict[str, Any]:
        result: Dict[str, Any] = dict(caption=self.title)
        if self.active:
            result["default"] = True
        result["elements"] = [i.to_legacy() for i in self.items]
        return result


class FormbuilderTabsItem(FormbuilderItem, tag="tabs"):
    legacy_type = "tabs"

    tabs: List[FormbuilderTab]

    @classmethod
    def attrs_from_legacy(cls, li):
        attrs = super().attrs_from_legacy(li)
        attrs["tabs"] = [FormbuilderTab.from_legacy(i) for i in li["pages"]]
        return attrs

    def validate(self, *, bind_field: BindFieldCallback) -> None:
        super().validate(bind_field=bind_field)
        for tab in self.tabs:
            tab.validate(bind_field=bind_field)


class FormbuilderSpacerItem(FormbuilderItem, tag="spacer"):
    legacy_type = "space"


class FormbuilderTextboxItem(FormbuilderItem, tag="textbox", kw_only=True):
    legacy_type = "text_edit"

    field: Annotated[
        FieldKeyname,
        FieldSpec(datatypes=(FIELD_TYPE.STRING,)),
        LegacySpec(attr="field"),
    ]
    remember: Remember
    initial: Annotated[Union[str, UnsetType], LegacySpec(attr="text", default="")] = UNSET
    max_lines: Annotated[int, Meta(ge=1, lt=256), LegacySpec(attr="max_string_count")]
    numbers_only: Annotated[bool, LegacySpec(attr="only_figures")]

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["attributes"].update({"ngid_login": False, "ngw_login": False})
        return result


class FormbuilderCheckboxItem(FormbuilderItem, tag="checkbox", kw_only=True):
    legacy_type = "checkbox"

    field: Annotated[
        FieldKeyname,
        FieldSpec(
            datatypes=(
                FIELD_TYPE.INTEGER,
                FIELD_TYPE.BIGINT,
                FIELD_TYPE.REAL,
                FIELD_TYPE.STRING,
            ),
        ),
        LegacySpec(attr="field"),
    ]
    remember: Remember
    initial: Annotated[
        Union[bool, UnsetType],
        LegacySpec(attr="init_value", default=False),
    ] = UNSET
    label: Annotated[str, LegacySpec(attr="text")]


class FormbuilderSystemItem(FormbuilderItem, tag="system", kw_only=True):
    legacy_type = "text_edit"

    field: Annotated[
        FieldKeyname,
        FieldSpec(datatypes=(FIELD_TYPE.STRING,)),
        LegacySpec(attr="field"),
    ]
    system: Literal["ngid_username", "ngw_username"]

    @classmethod
    def attrs_from_legacy(cls, la) -> Dict[str, Any]:
        attrs = super().attrs_from_legacy(la)
        if la["attributes"]["ngid_login"]:
            system = "ngid_username"
        elif la["attributes"]["ngw_login"]:
            system = "ngw_username"
        else:
            raise NotImplementedError
        attrs["system"] = system
        return attrs

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["attributes"].update(
            {
                "last": False,
                "text": "",
                "max_string_count": 1,
                "only_figures": False,
            },
            **{
                a: self.system == b
                for a, b in (
                    ("ngid_login", "ngid_username"),
                    ("ngw_login", "ngw_username"),
                )
            },
        )
        return result


class FormbuilderDatetimeItem(FormbuilderItem, tag="datetime", kw_only=True):
    legacy_type = "date_time"

    pat_date = r"[0-9]{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[1-2][0-9]|3[0-1])"
    pat_time = r"(?:[0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]"
    pat_datetime = pat_date + "T" + pat_time
    pat_current = "CURRENT"

    field: Annotated[
        FieldKeyname,
        FieldSpec(
            datatypes=(
                FIELD_TYPE.STRING,
                FIELD_TYPE.DATE,
                FIELD_TYPE.TIME,
                FIELD_TYPE.DATETIME,
            ),
        ),
        LegacySpec(attr="field"),
    ]
    remember: Remember
    datetime: Literal["date", "time", "datetime"]
    initial: (
        Annotated[str, Meta(pattern=rf"^(?:{pat_date}|{pat_time}|{pat_datetime}|{pat_current})")]
        | UnsetType
    ) = UNSET

    legacy_datetime_map = {
        "date": 0,
        "time": 1,
        "datetime": 2,
    }
    legacy_datetime_format = r"%Y-%m-%d %H:%M:%S"

    @classmethod
    def attrs_from_legacy(cls, li):
        attrs = super().attrs_from_legacy(li)

        ldtype = li["attributes"]["date_type"]
        for dt, date_type in cls.legacy_datetime_map.items():
            if ldtype == date_type:
                attrs["datetime"] = dt
                break
        else:
            raise ValueError(f"Unknown date_type {ldtype}.")

        if (ldt := li["attributes"]["datetime"]) is None:
            initial = "CURRENT"
        elif ldtype == 2:
            initial = datetime.strptime(ldt, cls.legacy_datetime_format).isoformat()
        else:
            initial = ldt
        attrs["initial"] = initial

        return attrs

    def validate(self, *, bind_field: BindFieldCallback) -> None:
        super().validate(bind_field=bind_field)
        if self.initial is not UNSET and self.initial != "CURRENT":
            pat = cast(str, getattr(self, f"pat_{self.datetime}"))
            if not re.fullmatch(pat, self.initial):
                raise ValidationError(
                    gettextf(
                        "Invalid initial value: '{i}'. Expected a value "
                        "matching the pattern for '{t}'."
                    ).format(i=self.initial, t=self.datetime)
                )

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()

        date_type = self.legacy_datetime_map[self.datetime]

        if self.initial is UNSET or self.initial == "CURRENT":
            dt = None
        elif self.datetime == "datetime":
            dt = datetime.fromisoformat(self.initial).strftime(self.legacy_datetime_format)
        else:
            dt = self.initial

        result["attributes"].update({"date_type": date_type, "datetime": dt})
        return result


class OptionSingle(Struct, kw_only=True):
    value: str
    label: str
    initial: Union[bool, UnsetType] = UNSET

    @classmethod
    def from_legacy(cls, li):
        return cls(
            value=li["name"],
            label=li["alias"],
            initial=li.get("default", UNSET),
        )

    def to_legacy(self) -> Dict[str, Any]:
        result: Dict[str, Any] = dict(
            name=self.value,
            alias=self.label,
        )
        if self.initial is not UNSET:
            result["default"] = self.initial
        return result


class FormbuilderRadioItem(FormbuilderItem, tag="radio", kw_only=True):
    legacy_type = "radio_group"

    field: Annotated[
        FieldKeyname,
        FieldSpec(datatypes=(FIELD_TYPE.STRING,)),
        LegacySpec(attr="field"),
    ]
    remember: Remember
    options: Annotated[List[OptionSingle], LegacySpec(attr="values")]


class FormbuilderDropdownItem(FormbuilderItem, tag="dropdown", kw_only=True):
    legacy_type = "combobox"

    field: Annotated[
        FieldKeyname,
        FieldSpec(datatypes=(FIELD_TYPE.STRING,)),
        LegacySpec(attr="field"),
    ]
    remember: Remember
    options: Annotated[List[OptionSingle], LegacySpec(attr="values")]
    free_input: Annotated[bool, LegacySpec(attr="allow_adding_values")]

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["attributes"].update({"input_search": True})
        return result


class OptionDual(Struct, kw_only=True):
    value: str
    first: str
    second: str
    initial: Union[bool, UnsetType] = UNSET

    @classmethod
    def from_legacy(cls, li):
        return cls(
            value=li["name"],
            first=li["alias"],
            second=li["alias2"],
            initial=li.get("default", UNSET),
        )

    def to_legacy(self) -> Dict[str, Any]:
        result: Dict[str, Any] = dict(
            name=self.value,
            alias=self.first,
            alias2=self.second,
        )
        if self.initial is not UNSET:
            result["default"] = self.initial
        return result


class FormbuilderDropdownDualItem(FormbuilderItem, tag="dropdown_dual", kw_only=True):
    legacy_type = "split_combobox"

    field: Annotated[
        FieldKeyname,
        FieldSpec(datatypes=(FIELD_TYPE.STRING,)),
        LegacySpec(attr="field"),
    ]
    remember: Remember
    options: Annotated[List[OptionDual], LegacySpec(attr="values")]
    label_first: Annotated[str, LegacySpec(attr="label1")]
    label_second: Annotated[str, LegacySpec(attr="label2")]


class CascadeOption(OptionSingle, kw_only=True):
    items: Annotated[List[OptionSingle], LegacySpec(attr="values")]

    @classmethod
    def from_legacy(cls, li):
        items = [OptionSingle.from_legacy(i) for i in li["values"]]
        return cls(
            value=li["name"],
            label=li["alias"],
            initial=li.get("default", UNSET),
            items=items,
        )

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["values"] = [o.to_legacy() for o in self.items]
        return result


class FormbuilderCascadeItem(FormbuilderItem, tag="cascade", kw_only=True):
    legacy_type = "double_combobox"

    field_primary: Annotated[
        FieldKeyname,
        FieldSpec(datatypes=(FIELD_TYPE.STRING,)),
        LegacySpec(attr="field_level1"),
    ]
    field_secondary: Annotated[
        FieldKeyname,
        FieldSpec(datatypes=(FIELD_TYPE.STRING,)),
        LegacySpec(attr="field_level2"),
    ]
    remember: Remember
    options: Annotated[List[CascadeOption], LegacySpec(attr="values")]


class FormbuilderCoordinatesItem(FormbuilderItem, tag="coordinates", kw_only=True):
    legacy_type = "coordinates"

    field_lon: Annotated[
        FieldKeyname,
        FieldSpec(datatypes=(FIELD_TYPE.REAL, FIELD_TYPE.STRING)),
        LegacySpec(attr="field_long"),
    ]
    field_lat: Annotated[
        FieldKeyname,
        FieldSpec(datatypes=(FIELD_TYPE.REAL, FIELD_TYPE.STRING)),
        LegacySpec(attr="field_lat"),
    ]
    hidden: Annotated[bool, LegacySpec(attr="hidden")]

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["attributes"].update({"crs": 0, "format": 0})
        return result


class FormbuilderDistanceItem(FormbuilderItem, tag="distance", kw_only=True):
    legacy_type = "distance"

    field: Annotated[
        FieldKeyname,
        FieldSpec(
            datatypes=(
                FIELD_TYPE.INTEGER,
                FIELD_TYPE.BIGINT,
                FIELD_TYPE.REAL,
                FIELD_TYPE.STRING,
            ),
        ),
        LegacySpec(attr="field"),
    ]


class FormbuilderAverageItem(FormbuilderItem, tag="average", kw_only=True):
    legacy_type = "average_counter"

    field: Annotated[
        FieldKeyname,
        FieldSpec(
            datatypes=(
                FIELD_TYPE.INTEGER,
                FIELD_TYPE.BIGINT,
                FIELD_TYPE.REAL,
                FIELD_TYPE.STRING,
            ),
        ),
        LegacySpec(attr="field"),
    ]
    samples: Annotated[int, Meta(ge=2, lt=10), LegacySpec(attr="num_values")]


class FormbuilderPhotoItem(FormbuilderItem, tag="photo", kw_only=True):
    legacy_type = "photo"

    max_count: Annotated[int, Meta(ge=1, lt=20), LegacySpec(attr="gallery_size")]
    comment: Annotated[str, LegacySpec(attr="comment")]


if TYPE_CHECKING:
    FormbuilderFormItemUnion = FormbuilderItem
else:
    FormbuilderFormItemUnion = Annotated[
        Union[tuple(FormbuilderItem.registry)],
        TSExport("FormbuilderFormItem"),
    ]
