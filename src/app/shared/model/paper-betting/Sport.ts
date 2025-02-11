import {SportType} from "../SportType";

export interface Sport {
    name: string;
    type: SportType;
    icon: string;
    upcoming: number;
}
