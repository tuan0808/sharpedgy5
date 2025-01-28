import {DashboardItem} from "./DashboardItem";

export interface Dashboard {
    id: number;
    name: string;
    description: string;
    modificationDate : Date,
    creationDate : Date,
    isEnabled : Boolean,
    defaultAccessRole : String,
    components : DashboardItem[]
}
