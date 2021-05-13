import { Component, EventEmitter, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { enumToValues } from '@core/helpers';
import { DtoInvoice, RefundReason } from '@core/interfaces';
import { MyselfService } from '@frontend/services/myself.service';
import { ToastService } from '@frontend/services/toast.service';
import { UiField, UiForm } from '@frontend/ui-lib/form/form.interfaces';
import { RefundReasonPipe } from '@frontend/_pipes/refund-reason.pipe';
import { UiDialogButton } from '../../../ui-lib/dialog/dialog-buttons/dialog-buttons.component';
import { IUiDialogOptions, ThemeKind } from '../../../ui-lib/ui-lib.interfaces';

@Component({
  selector: 'app-refund-dialog',
  templateUrl: './refund-dialog.component.html',
  styleUrls: ['./refund-dialog.component.css']
})
export class RefundDialogComponent implements OnInit, IUiDialogOptions {
  submit: EventEmitter<string> = new EventEmitter();
  cancel: EventEmitter<string> = new EventEmitter();
  buttons: UiDialogButton[];
  form: UiForm;
  refundReasonPipe = new RefundReasonPipe();
  constructor(
    private toastService: ToastService,
    private myselfService: MyselfService,
    private ref: MatDialogRef<RefundDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DtoInvoice
  ) {}

  ngOnInit(): void {
    this.form = new UiForm({
      fields: {
        reason: UiField.Select({
          label: 'Select a reason for requesting a refund',
          values: enumToValues(RefundReason).reduce((acc, curr) => {
            acc.set(curr, { label: this.refundReasonPipe.transform(curr) });
            return acc;
          }, new Map()),
          validators: [{ type: 'required' }]
        }),
        details: UiField.Textarea({
          label: 'Please provide details below'
        })
      },
      resolvers: {
        output: async v =>
          this.myselfService.requestInvoiceRefund({
            invoice_id: this.data.invoice_id,
            reason: v.reason,
            reason_detail: v.details
          })
      },
      handlers: {
        success: async () => {
          this.submit.emit();
          this.toastService.emit(`Refund requested for inv: ${this.data.invoice_id}`);
          this.ref.close();
        },
        failure: async err => {
          this.toastService.emit(err.message, ThemeKind.Danger);
          this.ref.close(null);
        }
      }
    });

    this.buttons = [
      new UiDialogButton({
        label: 'Cancel',
        kind: ThemeKind.Secondary,
        callback: () => this.cancel.emit()
      }),
      new UiDialogButton({
        label: 'Submit',
        kind: ThemeKind.Primary,
        disabled: true,
        callback: () => this.form.submit()
      }).attach(this.form, true)
    ];
  }
}
