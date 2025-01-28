import {GridsterItem} from "angular-gridster2";

export interface DashboardItem extends GridsterItem {
    id: number;
    component: string;
    isEnabled: boolean;
    category: string;
    defaultCols: number;
    defaultRows: number;
    creationDate: string;
    sports: string;
    description: string;
    modificationDate: string;
    type: string;
}
