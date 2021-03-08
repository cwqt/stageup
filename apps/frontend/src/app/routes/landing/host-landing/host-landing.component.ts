import { Component, EventEmitter, OnInit } from '@angular/core';
import { BaseAppService } from '../../../services/app.service';
import { HelperService } from '../../../services/helper.service';
import { IUiDialogOptions } from '../../../ui-lib/ui-lib.interfaces';

@Component({
  selector: 'app-host-landing',
  templateUrl: './host-landing.component.html',
  styleUrls: ['./host-landing.component.scss']
})
export class HostLandingComponent implements OnInit {

  constructor(private baseAppService:BaseAppService, private helperService:HelperService) { }

  ngOnInit(): void {
    
  }

  openHostRegister() {
    this.baseAppService.navigateTo(`/host/register`);
  }
}
