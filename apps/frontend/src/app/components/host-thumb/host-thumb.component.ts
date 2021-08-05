import { Component, Input, OnInit } from '@angular/core';
import { IHostStub } from '@core/interfaces';
import { AppService } from '@frontend/services/app.service';
@Component({
  selector: 'app-host-thumb',
  templateUrl: './host-thumb.component.html',
  styleUrls: ['./host-thumb.component.css']
})
export class HostThumbComponent implements OnInit {
  @Input() host: IHostStub;

  constructor(private appService: AppService) {}

  ngOnInit(): void {}

  openHostPage(): void {
    this.appService.navigateTo(`/@${this.host.username}`);
  }
}
