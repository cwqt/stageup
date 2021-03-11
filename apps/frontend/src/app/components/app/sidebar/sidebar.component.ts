import { Component, Input, OnInit } from '@angular/core';
import { IHostStub, IMyself } from '@core/interfaces';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  @Input() myself:IMyself;
  
  constructor() { }

  get user() { return this.myself.user }
  get host(): IHostStub { return this.myself.host }

  ngOnInit(): void {
  }
}
