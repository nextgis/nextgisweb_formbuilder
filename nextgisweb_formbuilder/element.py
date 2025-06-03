import re
from datetime import datetime
from itertools import chain
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
    legacy_attr: str = "field"


class FormbuilderItem(Struct, kw_only=True):
    registry: ClassVar[list[Type["FormbuilderItem"]]] = list()
    field_specs: ClassVar[Tuple[Tuple[str, FieldSpec], ...]]
    legacy_type: ClassVar[str]

    def __init_subclass__(cls, **kw):
        super().__init_subclass__(**kw)
        cls.registry.append(cls)
        cls.field_specs = tuple(
            chain.from_iterable(
                ((attr, extra) for extra in disannotate(tdef)[1] if isinstance(extra, FieldSpec))
                for attr, tdef in cls.__annotations__.items()
            )
        )

    def validate(self, *, bind_field: BindFieldCallback) -> None:
        for attr, spec in self.field_specs:
            keyname = getattr(self, attr)
            bind_field(keyname, spec.datatypes)

    def to_legacy(self) -> Dict[str, Any]:
        data: Dict[str, Any] = dict(type=self.legacy_type)
        attributes = data["attributes"] = dict()
        for attr, spec in self.field_specs:
            keyname = getattr(self, attr)
            attributes[spec.legacy_attr] = keyname
        return data


class FormbuilderLabelItem(FormbuilderItem, tag="label"):
    legacy_type = "text_label"

    label: str

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["attributes"]["text"] = self.label
        return result


class FormbuilderTab(Struct):
    title: str
    active: bool
    items: List["FormbuilderFormItemUnion"]

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

    def validate(self, *, bind_field: BindFieldCallback) -> None:
        super().validate(bind_field=bind_field)
        for tab in self.tabs:
            tab.validate(bind_field=bind_field)

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["pages"] = [t.to_legacy() for t in self.tabs]
        return result


class FormbuilderSpacerItem(FormbuilderItem, tag="spacer"):
    legacy_type = "space"


class FormbuilderTextboxItem(FormbuilderItem, tag="textbox", kw_only=True):
    legacy_type = "text_edit"

    field: Annotated[
        FieldKeyname,
        FieldSpec(datatypes=(FIELD_TYPE.STRING,)),
    ]
    remember: bool
    initial: Union[str, UnsetType] = UNSET
    max_lines: Annotated[int, Meta(ge=1, lt=256)]
    numbers_only: bool

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["attributes"].update(
            {
                "last": self.remember,
                "text": "" if self.initial is UNSET else self.initial,
                "max_string_count": self.max_lines,
                "only_figures": self.numbers_only,
                "ngid_login": False,
                "ngw_login": False,
            }
        )
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
    ]
    remember: bool
    initial: Union[bool, UnsetType] = UNSET
    label: str

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["attributes"].update(
            {
                "last": self.remember,
                "init_value": False if self.initial is UNSET else self.initial,
                "text": self.label,
            }
        )
        return result


class FormbuilderSystemItem(FormbuilderItem, tag="system", kw_only=True):
    legacy_type = "text_edit"

    field: Annotated[
        FieldKeyname,
        FieldSpec(
            datatypes=(FIELD_TYPE.STRING,),
            legacy_attr="field",
        ),
    ]
    system: Literal["ngid_username", "ngw_username"]

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

    pat_date = r"[0-9]{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|2[0-9]|3[0-1])"
    pat_time = r"(?:[01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]"
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
    ]
    remember: bool
    datetime: Literal["date", "time", "datetime"]
    initial: (
        Annotated[str, Meta(pattern=rf"^(?:{pat_date}|{pat_time}|{pat_datetime}|{pat_current})")]
        | UnsetType
    ) = UNSET

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

        if self.datetime == "date":
            date_type = 0
        elif self.datetime == "time":
            date_type = 1
        elif self.datetime == "datetime":
            date_type = 2
        else:
            raise NotImplementedError

        if self.initial is UNSET or self.initial == "CURRENT":
            dt = None
        elif self.datetime == "datetime":
            dt = datetime.fromisoformat(self.initial).strftime(r"%Y-%m-%d %H:%M:%S")
        else:
            dt = self.initial

        result["attributes"].update(
            {
                "last": self.remember,
                "date_type": date_type,
                "datetime": dt,
            }
        )
        return result


class OptionSingle(Struct, kw_only=True):
    value: str
    label: str
    initial: Union[bool, UnsetType] = UNSET

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
    ]
    remember: bool
    options: List[OptionSingle]

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["attributes"].update(
            {
                "last": self.remember,
                "values": [o.to_legacy() for o in self.options],
            }
        )
        return result


class FormbuilderDropdownItem(FormbuilderItem, tag="dropdown", kw_only=True):
    legacy_type = "combobox"

    field: Annotated[
        FieldKeyname,
        FieldSpec(datatypes=(FIELD_TYPE.STRING,)),
    ]
    remember: bool
    options: List[OptionSingle]
    free_input: bool

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["attributes"].update(
            {
                "last": self.remember,
                "values": [o.to_legacy() for o in self.options],
                "input_search": True,
                "allow_adding_values": self.free_input,
            }
        )
        return result


class OptionDual(Struct, kw_only=True):
    value: str
    first: str
    second: str
    initial: Union[bool, UnsetType] = UNSET

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
    ]
    remember: bool
    options: List[OptionDual]
    label_first: str
    label_second: str

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["attributes"].update(
            {
                "last": self.remember,
                "values": [o.to_legacy() for o in self.options],
                "label1": self.label_first,
                "label2": self.label_second,
            }
        )
        return result


class CascadeOption(OptionSingle, kw_only=True):
    items: List[OptionSingle]

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["values"] = [o.to_legacy() for o in self.items]
        return result


class FormbuilderCascadeItem(FormbuilderItem, tag="cascade", kw_only=True):
    legacy_type = "double_combobox"

    field_primary: Annotated[
        FieldKeyname,
        FieldSpec(
            datatypes=(FIELD_TYPE.STRING,),
            legacy_attr="field_level1",
        ),
    ]
    field_secondary: Annotated[
        FieldKeyname,
        FieldSpec(
            datatypes=(FIELD_TYPE.STRING,),
            legacy_attr="field_level2",
        ),
    ]
    remember: bool
    options: List[CascadeOption]

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["attributes"].update(
            {
                "last": self.remember,
                "values": [o.to_legacy() for o in self.options],
            }
        )
        return result


class FormbuilderCoordinatesItem(FormbuilderItem, tag="coordinates", kw_only=True):
    legacy_type = "coordinates"

    field_lon: Annotated[
        FieldKeyname,
        FieldSpec(
            datatypes=(FIELD_TYPE.REAL, FIELD_TYPE.STRING),
            legacy_attr="field_long",
        ),
    ]
    field_lat: Annotated[
        FieldKeyname,
        FieldSpec(
            datatypes=(FIELD_TYPE.REAL, FIELD_TYPE.STRING),
            legacy_attr="field_lat",
        ),
    ]
    hidden: bool

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["attributes"].update(
            {
                "hidden": self.hidden,
                "crs": 0,
                "format": 0,
            }
        )
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
    ]
    samples: Annotated[int, Meta(ge=2, lt=10)]

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["attributes"].update(
            {
                "num_values": self.samples,
            }
        )
        return result


class FormbuilderPhotoItem(FormbuilderItem, tag="photo", kw_only=True):
    legacy_type = "photo"

    max_count: Annotated[int, Meta(ge=1, lt=20)]
    comment: str

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["attributes"].update(
            {
                "gallery_size": self.max_count,
                "comment": self.comment,
            }
        )
        return result


if TYPE_CHECKING:
    FormbuilderFormItemUnion = FormbuilderItem
else:
    FormbuilderFormItemUnion = Annotated[
        Union[tuple(FormbuilderItem.registry)],
        TSExport("FormbuilderFormItem"),
    ]
