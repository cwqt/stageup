import { Component, EventEmitter, OnInit } from '@angular/core';
import { AppService } from '../../../services/app.service';
import { HelperService } from '../../../services/helper.service';
import { IUiDialogOptions } from '../../../ui-lib/ui-lib.interfaces';

@Component({
  selector: 'app-host-landing',
  templateUrl: './host-landing.component.html',
  styleUrls: ['./host-landing.component.scss']
})
export class HostLandingComponent implements OnInit {
  constructor(private appService: AppService, private helperService: HelperService) {}

  ngOnInit(): void {}

  openHostRegister() {
    this.appService.navigateTo(`/host/register`);
  }
}
