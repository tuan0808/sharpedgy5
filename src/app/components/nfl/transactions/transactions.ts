import {Component} from '@angular/core';
import {AgGridAngular} from "ag-grid-angular";
import {ColDef} from 'ag-grid-community';
import {AsyncPipe, KeyValuePipe, NgForOf} from "@angular/common";
import {DragScrollComponent, DragScrollItemDirective} from "ngx-drag-scroll";
import {MdbAccordionModule} from "mdb-angular-ui-kit/accordion";
import {NflDataService} from "../../../shared/services/nfl-data.service";
import months from '../../../../assets/data/Months.json'

class TransactionPlayer {
  constructor(public Name : string ,
              public Note : string,
              public Team : string,
              public FormerTeam : string,
              public Type : string,
              public updated : string) {}
}

@Component({
    selector: 'app-transactions',
    imports: [
        AgGridAngular,
        AsyncPipe,
        NgForOf,
        DragScrollComponent,
        DragScrollItemDirective,
        KeyValuePipe,
        MdbAccordionModule,
    ],
    templateUrl: './transactions.html',
    styleUrl: './transactions.scss'
})
export class TransactionsComponent {

  // Column Definitions: Defines the columns to be displayed.
  colDefs: ColDef[] = [
    {field: "Name"},
    {field: "Note"},
    {field: "Team"},
    {field: "Former Team"},
    {field: "Type"},
    {field: "Updated"}
  ];
  currentDate = new Date()
  protected dateList: any[] = []
  transactions: any[] = []

  constructor(private nflData: NflDataService) {
    this.dateList = this.getLastFiveDays()
    this.getData()
  }

  getData() {
    this.nflData.getTransactionsByDate(this.currentDate.toDateString()).then(t =>
        t.subscribe(s => {
          this.transactions = s.map(m=>
              new TransactionPlayer(
                  m.Name,
                  m.Note,
                  m.Team,
                  m.FormerTeam,
                  m.Type,
                  m.Updated

              )
          )
        }))
  }

  getLastFiveDays() {
    let result = [];
    for (let i = 0; i < 20; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      result.push(date);
    }
    return result;
  }

  getMonthByAbbrev(date: number) {
    // @ts-ignore
    return months.find(f => +f.numeric === date + 1).abbrevName
  }

  setCurrentDate(dl: Date) {
    this.currentDate = dl
    this.getData()

  }
}


