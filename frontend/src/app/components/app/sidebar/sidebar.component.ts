import { Component, Input, OnInit } from '@angular/core';
import { IUser } from '@eventi/interfaces';
import { BaseAppService } from 'src/app/services/app.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  @Input() currentUser:IUser;

  constructor(private appService:BaseAppService) { }

  ngOnInit(): void {
  }

  gotoRoot() {
    this.appService.navigateTo('/');
  }
}
