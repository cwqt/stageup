import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IHostStub, IUser } from '@eventi/interfaces';
import { MyselfService } from 'src/app/services/myself.service';

@Component({
  selector: 'app-host-settings',
  templateUrl: './host-settings.component.html',
  styleUrls: ['./host-settings.component.scss']
})
export class HostSettingsComponent implements OnInit {
  user:IUser;
  host:IHostStub;

  constructor(private myselfService:MyselfService, private route:ActivatedRoute) { }

  ngOnInit(): void {
    const myself = this.myselfService.$myself.value;
    this.user = myself.user;
    this.host = myself.host;
  }

}
