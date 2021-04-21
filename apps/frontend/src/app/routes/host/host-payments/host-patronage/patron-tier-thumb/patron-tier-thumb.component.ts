import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IPatronTier, IHostPatronTier, IHostStub } from '@core/interfaces';
import { HelperService } from 'apps/frontend/src/app/services/helper.service';
import { BecomePatronDialogComponent } from 'apps/frontend/src/app/routes/host/host-profile/host-profile-patronage/become-patron-dialog/become-patron-dialog.component';

function isHostPatronTier(patron: IPatronTier | IHostPatronTier): patron is IHostPatronTier {
  return (patron as IHostPatronTier).total_patrons !== undefined;
}

@Component({
  selector: 'app-patron-tier-thumb',
  templateUrl: './patron-tier-thumb.component.html',
  styleUrls: ['./patron-tier-thumb.component.scss']
})
export class PatronTierThumbComponent implements OnInit {
  @Input() host: IHostStub;
  @Input() tier: IPatronTier | IHostPatronTier;
  @Input() isHostPatronTier?: boolean;

  constructor(private helperService: HelperService, private dialog: MatDialog) {}

  ngOnInit(): void {
    if (typeof this.isHostPatronTier != 'boolean') {
      this.isHostPatronTier = isHostPatronTier(this.tier);
    }
  }

  openBecomePatronDialog() {
    this.helperService.showDialog(
      this.dialog.open(BecomePatronDialogComponent, { data: { tier: this.tier, host: this.host }, minWidth: '600px' }),
      () => {}
    );
  }
}
