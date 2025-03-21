import { Component, OnInit } from '@angular/core';
import { ChatUsers } from '../../model/chat.model';
import { ChatService } from '../../services/chat.service';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-right-sidebar',
  standalone: true,
  imports: [CommonModule,RouterModule,FormsModule],
  templateUrl: './right-sidebar.component.html',
  styleUrls: ['./right-sidebar.component.scss']
})
export class RightSidebarComponent implements OnInit {

  public users: ChatUsers[] = []
  public searchUsers: ChatUsers[] = []
  public notFound: boolean = false
  public searchText: string = ''

  constructor(private chatService: ChatService) {
    this.chatService.getUsers().subscribe(users => {
      this.searchUsers = users
      this.users = users
    })
  }

  searchTerm(term: any) {
    if (!term) return this.searchUsers = this.users
    term = term.toLowerCase();
    let user: [] | any= []
    this.users.filter(users => {
      if (users.name.toLowerCase().includes(term)) {
        user.push(users)
      }
    })
    this.checkSearchResultEmpty(user)
    this.searchUsers = user
    return
  }

  checkSearchResultEmpty(user:any) {
    if (!user.length)
      this.notFound = true;
    else
      this.notFound = false;
  }

  ngOnInit() { }

}
