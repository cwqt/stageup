import { Component, Inject, OnInit, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IHostStub, IPatronSubscription, IPatronTier } from '@core/interfaces';
import { cachize, createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { HostService } from 'apps/frontend/src/app/services/host.service';
import { PatronageService } from 'apps/frontend/src/app/services/patronage.service';
import { ToastService } from 'apps/frontend/src/app/services/toast.service';
import { UiDialogButton } from 'apps/frontend/src/app/ui-lib/dialog/dialog-buttons/dialog-buttons.component';
import { IUiDialogOptions, ThemeKind } from 'apps/frontend/src/app/ui-lib/ui-lib.interfaces';

@Component({
  selector: 'app-become-patron-dialog',
  templateUrl: './become-patron-dialog.component.html',
  styleUrls: ['./become-patron-dialog.component.scss']
})
export class BecomePatronDialogComponent implements OnInit, IUiDialogOptions {
  buttons: UiDialogButton[];

  submit: EventEmitter<void> = new EventEmitter();
  cancel: EventEmitter<void> = new EventEmitter();

  subscription: ICacheable<IPatronSubscription> = createICacheable();

  constructor(
    private toastService: ToastService,
    private patronageService: PatronageService,
    public ref: MatDialogRef<BecomePatronDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { tier: IPatronTier; host: IHostStub }
  ) {}

  ngOnInit(): void {
    this.buttons = [
      new UiDialogButton({
        label: 'Cancel',
        kind: ThemeKind.Secondary,
        callback: () => this.cancel.emit()
      }),
      new UiDialogButton({
        label: 'Become a Patron',
        kind: ThemeKind.Primary,
        callback: () =>
          this.subscribeToTier()
            .then(() => this.toastService.emit(`Successfully subscribed to ${this.data.tier.name}!`, ThemeKind.Accent))
            .catch(() =>
              this.toastService.emit(`Failed to subscribe to tier, please try again later`, ThemeKind.Danger)
            )
            .finally(() => this.ref.close())
      })
    ];
  }

  async subscribeToTier() {
    return cachize(
      this.patronageService.subscribeToPatronTier(this.data.host._id, this.data.tier._id),
      this.subscription
    );
  }
}
