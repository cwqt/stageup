import { Component, OnInit } from '@angular/core';
import { IMyself } from '@core/interfaces';
import { BaseAppService } from '../../../services/app.service';
import { MyselfService } from '../../../services/myself.service';

@Component({
  selector: 'app-host-landing',
  templateUrl: './host-landing.component.html',
  styleUrls: ['./host-landing.component.scss']
})
export class HostLandingComponent implements OnInit {
  myself:IMyself;

  constructor(private baseAppService:BaseAppService, private myselfService:MyselfService) { }

  ngOnInit(): void {
  }

}
