import { Component, OnInit } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { IHost, IHostStub, IMyself, IUser } from '@core/interfaces';
import { BaseAppService } from 'apps/frontend/src/app/services/app.service';
import { MyselfService } from 'apps/frontend/src/app/services/myself.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  myself:IMyself;

  constructor(
    private myselfService:MyselfService, 
    private baseAppService:BaseAppService
  ) { }

  tabs:Array<{ label:string, route: string}>

  async ngOnInit() {
    this.myself = this.myselfService.$myself.value;

    this.tabs = [
      { label: "Your Account", route: "/settings" },
      { label: "Payments", route: "/settings/billing" },
      { label: "Patronage", route: "/settings/patronage" },
      { label: "Subscriptions", route: "/settings/subscription" },
      { label: this.myself.host ? "Host" : "Create a Host", route: "/settings/host" },
    ]
  }

  openTabLink(event:MatTabChangeEvent) {
    this.baseAppService.navigateTo(this.tabs[event.index].route);
  }
}