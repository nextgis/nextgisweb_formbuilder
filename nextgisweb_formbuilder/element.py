from datetime import datetime
from typing import TYPE_CHECKING, Any, ClassVar, Dict, List, Literal, Type, TypeVar, Union

from msgspec import UNSET, Meta, Struct, UnsetType
from typing_extensions import Annotated

from nextgisweb.jsrealm import TSExport

T = TypeVar("T", bound=Type["FormbuilderItem"])


class FormbuilderItem(Struct, kw_only=True):
    registry: ClassVar[List[Type["FormbuilderItem"]]] = list()
    legacy_type: ClassVar[str]

    @classmethod
    def register(cls, item: T) -> T:
        cls.registry.append(item)
        return item

    def to_legacy(self) -> Dict[str, Any]:
        return dict(type=self.legacy_type, attributes=dict())


@FormbuilderItem.register
class FormbuilderLabelItem(FormbuilderItem, tag="label"):
    legacy_type = "text"

    label: str

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["attributes"]["text"] = self.label
        return result


class FormbuilderTab(Struct):
    title: str
    active: bool
    items: List["FormbuilderFormItemUnion"]

    def to_legacy(self) -> Dict[str, Any]:
        result: Dict[str, Any] = dict(caption=self.title)
        if self.active:
            result["default"] = True
        result["elements"] = [i.to_legacy() for i in self.items]
        return result


@FormbuilderItem.register
class FormbuilderTabsItem(FormbuilderItem, tag="tabs"):
    legacy_type = "tabs"

    tabs: List[FormbuilderTab]

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["pages"] = [t.to_legacy() for t in self.tabs]
        return result


@FormbuilderItem.register
class FormbuilderSpacerItem(FormbuilderItem, tag="spacer"):
    legacy_type = "space"


class FormbuilderFieldItem(FormbuilderItem):
    field: str

    remember: bool

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["attributes"].update(
            {
                "field": self.field,
                "last": self.remember,
            }
        )
        return result


@FormbuilderItem.register
class FormbuilderTextboxItem(FormbuilderFieldItem, tag="textbox", kw_only=True):
    legacy_type = "text_edit"

    initial: Union[str, UnsetType] = UNSET
    max_lines: Annotated[int, Meta(ge=1, lt=256)]
    numbers_only: bool

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["attributes"].update(
            {
                "text": "" if self.initial is UNSET else self.initial,
                "max_string_count": self.max_lines,
                "only_figures": self.numbers_only,
                "ngid_login": False,
                "ngw_login": False,
            }
        )
        return result


@FormbuilderItem.register
class FormbuilderCheckboxItem(FormbuilderFieldItem, tag="checkbox", kw_only=True):
    legacy_type = "checkbox"

    initial: Union[bool, UnsetType] = UNSET
    label: str

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["attributes"].update(
            {
                "init_value": False if self.initial is UNSET else self.initial,
                "text": self.label,
            }
        )
        return result


@FormbuilderItem.register
class FormbuilderSystemItem(FormbuilderItem, tag="system", kw_only=True):
    legacy_type = "text_edit"

    system: Literal["ngid_username", "ngw_username"]

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        type_attrs = dict(
            ngid_username="ngid_login",
            ngw_username="ngw_login",
        )
        result["attributes"].update(
            {
                "text": "",
                "max_string_count": 1,
                "only_figures": False,
            }
        )
        result["attributes"][type_attrs.pop(self.system)] = True
        for v in type_attrs.values():
            result["attributes"][v] = False
        return result


@FormbuilderItem.register
class FormbuilderDatetimeItem(FormbuilderFieldItem, tag="datetime", kw_only=True):
    legacy_type = "date_time"

    initial: Union[str, UnsetType] = UNSET
    datetime: Literal["date", "time", "datetime"]

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

        if self.initial is UNSET:
            dt = None
        elif self.datetime == "datetime":
            dt = datetime.fromisoformat(self.initial).strftime(r"%Y-%m-%d %H:%M:%S")
        else:
            dt = self.initial

        result["attributes"].update(
            {
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


@FormbuilderItem.register
class FormbuilderRadioItem(FormbuilderFieldItem, tag="radio", kw_only=True):
    legacy_type = "radio_group"

    options: List[OptionSingle]

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["attributes"].update(
            {
                "values": [o.to_legacy() for o in self.options],
            }
        )
        return result


@FormbuilderItem.register
class FormbuilderDropdownItem(FormbuilderFieldItem, tag="dropdown", kw_only=True):
    legacy_type = "combobox"

    options: List[OptionSingle]
    free_input: bool

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["attributes"].update(
            {
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


@FormbuilderItem.register
class FormbuilderDropdownDualItem(FormbuilderFieldItem, tag="dropdown_dual", kw_only=True):
    legacy_type = "split_compobox"

    options: List[OptionDual]
    label_first: str
    label_second: str

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["attributes"].update(
            {
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


@FormbuilderItem.register
class FormbuilderCascadeItem(FormbuilderItem, tag="cascade", kw_only=True):
    legacy_type = "double_combobox"

    field_primary: str
    field_secondary: str
    remember: bool
    options: List[CascadeOption]

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["attributes"].update(
            {
                "field_level1": self.field_primary,
                "field_level2": self.field_secondary,
                "last": self.remember,
                "values": [o.to_legacy() for o in self.options],
            }
        )
        return result


@FormbuilderItem.register
class FormbuilderCoordinatesItem(FormbuilderItem, tag="coordinates", kw_only=True):
    legacy_type = "coordinates"

    field_lon: str
    field_lat: str
    hidden: bool

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["attributes"].update(
            {
                "field_long": self.field_lon,
                "field_lat": self.field_lat,
                "hidden": self.hidden,
                "crs": 0,
                "format": 0,
            }
        )
        return result


@FormbuilderItem.register
class FormbuilderDistanceItem(FormbuilderItem, tag="distance", kw_only=True):
    legacy_type = "distance"

    field: str

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["attributes"].update(
            {
                "field": self.field,
            }
        )
        return result


@FormbuilderItem.register
class FormbuilderAverageItem(FormbuilderItem, tag="average", kw_only=True):
    legacy_type = "average_counter"

    field: str
    samples: Annotated[int, Meta(ge=2, lt=10)]

    def to_legacy(self) -> Dict[str, Any]:
        result = super().to_legacy()
        result["attributes"].update(
            {
                "field": self.field,
                "num_values": self.samples,
            }
        )
        return result


@FormbuilderItem.register
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
