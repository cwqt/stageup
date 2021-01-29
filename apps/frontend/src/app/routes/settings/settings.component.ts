import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IHost, IHostStub, IUser } from '@eventi/interfaces';
import { BaseAppService } from 'apps/frontend/src/app/services/app.service';
import { MyselfService } from 'apps/frontend/src/app/services/myself.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  user:IUser;
  userHost:IHostStub;

  constructor(private myselfService:MyselfService, private route:ActivatedRoute, private baseAppService:BaseAppService) {
  }

  async ngOnInit() {
    const myself = this.myselfService.$myself.value;
    this.user = myself.user;
    this.userHost = myself.host;

    if(this.route.children.length == 0) {
      // not outletting, redirect to /settings/profile
      this.baseAppService.navigateTo(`settings/profile`);
    }
  }
}
