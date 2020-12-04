import { Component, Input, OnInit } from '@angular/core';
import { IUser } from '@cxss/interfaces';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  @Input() currentUser:IUser;

  constructor() { }

  ngOnInit(): void {
  }

}
