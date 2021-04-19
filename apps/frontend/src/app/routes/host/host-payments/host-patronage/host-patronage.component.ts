import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { IPatronTier } from '@core/interfaces';
import { cachize, createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { HelperService } from 'apps/frontend/src/app/services/helper.service';
import { HostService } from 'apps/frontend/src/app/services/host.service';
import { CreateUpdatePatronTierComponent } from './create-update-patron-tier/create-update-patron-tier.component';

@Component({
  selector: 'app-host-patronage',
  templateUrl: './host-patronage.component.html',
  styleUrls: ['./host-patronage.component.scss']
})
export class HostPatronageComponent implements OnInit {
  tiers: ICacheable<IPatronTier[]> = createICacheable([]);

  constructor(private hostService: HostService, private helperService: HelperService, private dialog: MatDialog) {}

  async ngOnInit() {
    await cachize(this.hostService.readPatreonTiers(this.hostService.hostId), this.tiers, data =>
      data.sort((a, b) => (a.amount > b.amount ? 1 : -1))
    );
  }

  openCreateTierDialog() {
    this.helperService.showDialog(
      this.dialog.open(CreateUpdatePatronTierComponent, { data: { operation: 'create' }, width: '600px' }),
      (tier: IPatronTier) => {
        this.tiers.data.push(tier);
        this.tiers.data.sort((a, b) => (a.amount > b.amount ? 1 : -1));
      }
    );
  }
}
