import { Injectable } from '@angular/core';
import {GridsterItem} from "angular-gridster2";
import {HttpClient} from "@angular/common/http";
import * as http from "http";

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(private httpClient : HttpClient) { }

  saveDashboard(dashboard: Array<GridsterItem>) {
   // this.httpClient.post("localhost")
  }
}
