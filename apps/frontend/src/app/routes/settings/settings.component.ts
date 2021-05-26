import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { IHost, IHostStub, IMyself, IUser } from '@core/interfaces';
import { BaseAppService } from 'apps/frontend/src/app/services/app.service';
import { MyselfService } from 'apps/frontend/src/app/services/myself.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, AfterViewInit {
  @ViewChild(MatTabGroup) tabGroup: MatTabGroup;
  myself: IMyself;

  constructor(private myselfService: MyselfService) {}

  async ngOnInit() {
    this.myself = this.myselfService.$myself.value;
  }

  ngAfterViewInit() {}
}
