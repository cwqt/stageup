import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { MatChipInputEvent } from '@angular/material/chips';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IHost, IPerformance } from '@core/interfaces';
import { cachize, createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { HostService } from 'apps/frontend/src/app/services/host.service';
import { ToastService } from 'apps/frontend/src/app/services/toast.service';
import { UiDialogButton } from 'apps/frontend/src/app/ui-lib/dialog/dialog-buttons/dialog-buttons.component';
import { IUiDialogOptions, SecondaryButton, ThemeKind } from 'apps/frontend/src/app/ui-lib/ui-lib.interfaces';

@Component({
  selector: 'app-share-performance-dialog',
  templateUrl: './share-performance-dialog.component.html',
  styleUrls: ['./share-performance-dialog.component.scss']
})
export class SharePerformanceDialogComponent implements OnInit, IUiDialogOptions {
  @Output() submit: EventEmitter<void> = new EventEmitter();
  @Output() cancel: EventEmitter<void> = new EventEmitter();
  buttons: IUiDialogOptions['buttons'] = [
    new UiDialogButton({
      label: $localize`Cancel`,
      kind: SecondaryButton,
      callback: () => this.cancel.emit()
    }),
    new UiDialogButton({
      label: $localize`Send Requests`,
      kind: ThemeKind.Primary,
      loading: false,
      disabled: true,
      callback: () => this.provisionTokensForUsers()
    })
  ];

  shareCacheable: ICacheable<void> = createICacheable();
  addedEmailAddresses: string[] = [];
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { host: IHost; performance: IPerformance },
    private hostService: HostService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {}

  async provisionTokensForUsers() {
    await cachize(
      this.hostService.provisionPerformanceAccessTokens(
        this.data.host._id,
        this.data.performance._id,
        this.addedEmailAddresses
      ),
      this.shareCacheable
    ).then(() => this.toastService.emit($localize`Shared performance with ${this.addedEmailAddresses.length} users`));

    this.submit.emit();
  }

  add(event: MatChipInputEvent): void {
    // Add new email
    if (event.value?.trim()) this.addedEmailAddresses.push(event.value.trim());
    // Reset the input value
    if (event.input) event.input.value = '';
    this.setDialogDisabledState();
  }

  remove(idx: number): void {
    this.addedEmailAddresses.splice(idx, 1);
    this.setDialogDisabledState();
  }

  setDialogDisabledState() {
    this.buttons[1].disabled = this.addedEmailAddresses.length === 0;
  }
}
