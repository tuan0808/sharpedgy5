import { Routes } from '@angular/router';
import { SupportTicketComponent } from './support-ticket.component';

export const supportTicket: Routes = [
    {
        path: '',
        component: SupportTicketComponent,
        data: {
            title: "Support Ticket",
            breadcrumb: ""
        }
    }
]