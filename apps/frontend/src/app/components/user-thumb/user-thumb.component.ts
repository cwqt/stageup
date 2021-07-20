import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IHostStub, IUserStub } from '@core/interfaces';
import { BaseAppService } from '@frontend/services/app.service';

@Component({
  selector: 'app-user-thumb',
  templateUrl: './user-thumb.component.html',
  styleUrls: ['./user-thumb.component.scss']
})
export class UserThumbComponent implements OnInit {
  @Input() user: IUserStub | IHostStub;
  @Input() small: boolean = false;

  constructor(private baseAppService: BaseAppService, private dialog: MatDialog) {}

  ngOnInit(): void {}

  openHostDialog() {
    this.baseAppService.navigateTo(`/@${this.user.username}`);
    this.dialog.closeAll();
  }
}
