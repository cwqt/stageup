import { SelectionModel } from '@angular/cdk/collections';
import { Component, Inject, Input, OnInit, Output, EventEmitter, ViewChild } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatRadioButton } from '@angular/material/radio';
import { timeout } from '@core/helpers';
import { IPaymentMethodStub } from '@core/interfaces';
import { HelperService } from '@frontend/services/helper.service';
import { MyselfService } from '@frontend/services/myself.service';
import { ToastService } from '@frontend/services/toast.service';
import { UiDialogButton } from '@frontend/ui-lib/dialog/dialog-buttons/dialog-buttons.component';
import { IUiDialogOptions, ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-payment-method-thumb',
  templateUrl: './payment-method-thumb.component.html',
  styleUrls: ['./payment-method-thumb.component.scss']
})
export class PaymentMethodThumbComponent implements OnInit {
  @Output() deletedMethod: EventEmitter<IPaymentMethodStub> = new EventEmitter();
  @Output() clickedExpandButton: EventEmitter<boolean> = new EventEmitter();

  @Input() method: IPaymentMethodStub;
  @Input() isEditing: boolean;
  @Input() isExpanded: boolean;
  @Input() selection?: SelectionModel<IPaymentMethodStub>;

  constructor(
    private helperService: HelperService,
    private dialog: MatDialog,
    private myselfService: MyselfService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {}

  openEditMenu() {}

  openDeleteConfirmation() {
    const loading = new BehaviorSubject(false);

    this.helperService.showConfirmationDialog(this.dialog, {
      loading: loading.asObservable(),
      title: $localize`Delete Payment Method`,
      description: $localize`This will permanently remove the card ending in ${this.method.last4} from your account.`,
      buttons: [
        new UiDialogButton({
          label: $localize`Cancel`,
          kind: ThemeKind.Secondary,
          callback: ref => ref.close()
        }),
        new UiDialogButton({
          label: $localize`Delete`,
          kind: ThemeKind.Danger,
          callback: async ref => {
            try {
              loading.next(true);
              await this.myselfService.deletePaymentMethod(this.method._id);
              this.toastService.emit($localize`Deleted card`, ThemeKind.Accent);
              this.deletedMethod.emit(this.method);
            } catch (error) {
              this.toastService.emit($localize`Failed to delete the card`, ThemeKind.Danger);
            } finally {
              loading.next(false);
              ref.close();
            }
          }
        })
      ]
    });
  }
}
