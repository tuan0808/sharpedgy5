import {Component, EventEmitter, Input, Output, Signal, WritableSignal} from '@angular/core';
import {Account} from "../../../shared/model/paper-betting/Account";
import {CurrencyPipe, DatePipe} from "@angular/common";
import {format} from "date-fns";

@Component({
  selector: 'app-account-accordion',
  standalone: true,
  imports: [
    DatePipe,
    CurrencyPipe
  ],
  templateUrl: './account-accordion.component.html',
  styleUrl: './account-accordion.component.scss'
})
export class AccountAccordionComponent {
  @Input() account:  WritableSignal<Account>;
  @Input() initialBalance!: number;
  @Input() isExpanded = false;
  @Output() toggle = new EventEmitter<void>();



    protected readonly Date = Date;
    protected readonly format = format;
}
