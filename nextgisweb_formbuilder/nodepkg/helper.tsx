import average_counter from "@nextgisweb/formbuilder/editor-widget/icon/average_counter.svg";
import chain_to_fields from "@nextgisweb/formbuilder/editor-widget/icon/chain_to_fields.svg";
import checkbox from "@nextgisweb/formbuilder/editor-widget/icon/checkbox.svg";
import combo_box from "@nextgisweb/formbuilder/editor-widget/icon/combo_box.svg";
import coords from "@nextgisweb/formbuilder/editor-widget/icon/coords.svg";
import counter from "@nextgisweb/formbuilder/editor-widget/icon/counter.svg";
import date_time from "@nextgisweb/formbuilder/editor-widget/icon/date_time.svg";
import dep_combo_boxes from "@nextgisweb/formbuilder/editor-widget/icon/dep_combo_boxes.svg";
import distance_meter from "@nextgisweb/formbuilder/editor-widget/icon/distance_meter.svg";
import label from "@nextgisweb/formbuilder/editor-widget/icon/label.svg";
import photo from "@nextgisweb/formbuilder/editor-widget/icon/photo.svg";
import radio_group from "@nextgisweb/formbuilder/editor-widget/icon/radio_group.svg";
import sign_field from "@nextgisweb/formbuilder/editor-widget/icon/sign_field.svg";
import split_combo_box from "@nextgisweb/formbuilder/editor-widget/icon/split_combo_box.svg";
import tabs from "@nextgisweb/formbuilder/editor-widget/icon/tabs.svg";
import textbox from "@nextgisweb/formbuilder/editor-widget/icon/textbox.svg";
import void_space from "@nextgisweb/formbuilder/editor-widget/icon/void_space.svg";

import type { IconComponent } from "@nextgisweb/icon/index";

export type IconName = keyof typeof iconMap;

const iconMap = {
    average_counter,
    chain_to_fields,
    checkbox,
    combo_box,
    coords,
    counter,
    date_time,
    dep_combo_boxes,
    distance_meter,
    label,
    photo,
    radio_group,
    sign_field,
    split_combo_box,
    tabs,
    textbox,
    void_space,
};

const getIconComponent = (iconName: IconName): IconComponent => {
    if (Object.hasOwn(iconMap, iconName)) {
        return iconMap[iconName];
    }
    throw new Error(`Icon '${iconName}' does not exist`);
};

export { getIconComponent };
