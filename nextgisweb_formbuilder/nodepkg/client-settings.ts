import { fetchSettings } from "@nextgisweb/pyramid/settings";

export interface FormbuilderSettings {
    designer: boolean;
}

export default await fetchSettings<FormbuilderSettings>(COMP_ID);
