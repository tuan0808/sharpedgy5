import {Component, EventEmitter, input, Input, InputSignal, Output, WritableSignal} from '@angular/core';
import {NgClass, NgStyle} from "@angular/common";
import {Notification} from "../../model/Notification";

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [
    NgStyle,
    NgClass
  ],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss'
})
export class NotificationComponent {
  //input.required<Game>();
  notification: InputSignal<Notification> = input.required<Notification>();
  @Output() close = new EventEmitter<string>();

  closeNotification(): void {
    this.close.emit();
  }
}
