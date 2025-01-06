import {GridsterItem} from "angular-gridster2";

export interface DashboardItem extends GridsterItem {
    component: string;
    id: string;
}
