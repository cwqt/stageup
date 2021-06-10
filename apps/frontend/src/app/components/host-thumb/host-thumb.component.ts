import { Component, Input, OnInit } from '@angular/core';
import { IHostStub } from '@core/interfaces';
import { BaseAppService } from '@frontend/services/app.service';
@Component({
  selector: 'app-host-thumb',
  templateUrl: './host-thumb.component.html',
  styleUrls: ['./host-thumb.component.css']
})
export class HostThumbComponent implements OnInit {
  @Input() host: IHostStub;

  constructor(private baseAppService: BaseAppService) {}

  ngOnInit(): void {}

  openHostPage(): void {
    this.baseAppService.navigateTo(`/@${this.host.username}`);
  }
}
