import { Component, Input, OnInit, EventEmitter, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IPatronTier, IHostPatronTier, IHostStub } from '@core/interfaces';
import { HelperService } from 'apps/frontend/src/app/services/helper.service';
import { BecomePatronDialogComponent } from 'apps/frontend/src/app/routes/host/host-profile/host-profile-patronage/become-patron-dialog/become-patron-dialog.component';
import { UiDialogButton } from '@frontend/ui-lib/dialog/dialog-buttons/dialog-buttons.component';
import { ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';
import { Cacheable } from '@frontend/app.interfaces';
import { HostService } from '@frontend/services/host.service';
import { ToastService } from '@frontend/services/toast.service';

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

  @Output() deleted: EventEmitter<void> = new EventEmitter();

  deleteTierRequest = new Cacheable();

  constructor(
    private helperService: HelperService,
    private toastService: ToastService,
    private hostService: HostService,
    private dialog: MatDialog
  ) {}

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

  openDeleteTierConfirmationDialog() {
    this.helperService.showConfirmationDialog(this.dialog, {
      title: $localize`Delete patron tier`,
      description: $localize`Are you sure you want to delete ${this.tier.name}?\n This action will unsubscribe all ${
        (this.tier as IHostPatronTier).total_patrons
      } patrons`,
      loading: this.deleteTierRequest.$loading,
      buttons: [
        new UiDialogButton({ label: $localize`Cancel`, kind: ThemeKind.Secondary, callback: ref => ref.close() }),
        new UiDialogButton({
          label: $localize`Delete Patron Tier`,
          kind: ThemeKind.Danger,
          callback: async ref =>
            await this.deleteTierRequest
              .request(this.hostService.deletePatronTier(this.host._id, this.tier._id))
              .then(
                () => (this.deleted.emit(), this.toastService.emit($localize`Patron tier deleted!`, ThemeKind.Accent))
              )
              .catch(() => this.toastService.emit($localize`Failed deleting patron tier, please try again later`))
              .finally(() => ref.close())
        })
      ]
    });
  }
}
