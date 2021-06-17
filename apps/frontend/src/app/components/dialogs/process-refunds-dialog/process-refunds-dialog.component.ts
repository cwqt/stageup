import { Component, EventEmitter, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IHostInvoice, IHostInvoiceStub, IRefund, RefundRequestReason } from '@core/interfaces';
import { Cacheable, cachize, createICacheable, ICacheable } from '@frontend/app.interfaces';
import { HelperService } from '@frontend/services/helper.service';
import { HostService } from '@frontend/services/host.service';
import { ToastService } from '@frontend/services/toast.service';
import { UiDialogButton } from '@frontend/ui-lib/dialog/dialog-buttons/dialog-buttons.component';
import { UiForm } from '@frontend/ui-lib/form/form.interfaces';
import { IUiDialogOptions, ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';
import { merge, Observable } from 'rxjs';
import { IConfirmationDialogData } from '../confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-process-refunds-dialog',
  templateUrl: './process-refunds-dialog.component.html',
  styleUrls: ['./process-refunds-dialog.component.css']
})
export class ProcessRefundsDialogComponent implements OnInit, IUiDialogOptions {
  submit: EventEmitter<string> = new EventEmitter();
  cancel: EventEmitter<string> = new EventEmitter();
  buttons?: UiDialogButton[];
  public invoice: Cacheable<IHostInvoice> = new Cacheable();
  public refunds: Cacheable<IRefund[]> = new Cacheable({ data: [] });
  public multipleRefunds: boolean;
  public bulkRefundForm: UiForm;
  refundRequest: Cacheable<void> = new Cacheable();

  // Top level loading state for all requests - made via merge()
  $loading: Observable<boolean>;

  constructor(
    private toastService: ToastService,
    private hostService: HostService,
    private helperService: HelperService,
    @Inject(MAT_DIALOG_DATA) public data: IHostInvoiceStub[],
    private ref: MatDialogRef<ProcessRefundsDialogComponent>,
    private dialog: MatDialog
  ) {}

  async ngOnInit(): Promise<void> {
    this.bulkRefundForm = new UiForm({
      fields: {
        reason: UiField.Select({
          label: 'Select a reason for the refunds',
          values: enumToValues(RefundRequestReason).reduce((acc, curr) => {
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
          this.myselfService.requestInvoiceRefund(this.data.invoice_id, {
            requested_on: timestamp(),
            request_reason: v.reason,
            request_detail: v.details
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

    this.$loading = merge(this.refunds.$loading, this.invoice.$loading);
    this.data.length > 1 ? (this.multipleRefunds = true) : (this.multipleRefunds = false);

    await Promise.all([
      // this.refunds.request(this.hostService.readInvoiceRefunds(this.hostService.hostId, this.data.invoice_id)),
      // this.invoice.request(this.hostService.readInvoice(this.hostService.hostId, this.data.invoice_id))
    ]);

    let confirmDialogData: IConfirmationDialogData = {
      title: $localize`Confirm refund`,
      description: $localize`Are you sure you want to refund this(these) invoice(s)?`,
      buttons: [
        new UiDialogButton({
          label: $localize`Cancel`,
          kind: ThemeKind.Secondary,
          callback: () => this.dialog.closeAll()
        }),
        new UiDialogButton({
          label: $localize`Yes`,
          kind: ThemeKind.Primary,
          callback: () =>
            cachize(
              this.hostService.processRefunds(
                this.data.map(invoice => invoice.invoice_id),
                this.hostService.hostId
              ),
              this.refundRequest
            )
              .then(() => {
                this.toastService.emit($localize`Refund(s) successfully processed`);
                this.dialog.closeAll();
              })
              .catch(() => this.toastService.emit($localize`Error processing refund(s)`))
        })
      ]
    };

    this.buttons = [
      new UiDialogButton({
        label: $localize`Cancel`,
        kind: ThemeKind.Secondary,
        callback: () => this.cancel.emit()
      }),
      new UiDialogButton({
        label: $localize`Refund`,
        kind: ThemeKind.Primary,
        callback: () => this.helperService.showConfirmationDialog(this.dialog, confirmDialogData, null, null)
      })
    ];
  }
}
