import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IHostInvoice, IUserInvoice, DtoInvoice, PaymentStatus } from '@core/interfaces';
import { cachize, createICacheable, ICacheable } from '@frontend/app.interfaces';
import { ChipComponent } from '@frontend/ui-lib/chip/chip.component';
import { HostService } from '@frontend/services/host.service';
import { MyselfService } from '@frontend/services/myself.service';
import { HelperService } from '@frontend/services/helper.service';
import { RefundDialogComponent } from '../refund-dialog/refund-dialog.component';
import { IUiDialogOptions } from '@frontend/ui-lib/ui-lib.interfaces';

@Component({
  selector: 'app-invoice-dialog',
  templateUrl: './invoice-dialog.component.html',
  styleUrls: ['./invoice-dialog.component.scss']
})
export class InvoiceDialogComponent implements OnInit, IUiDialogOptions {
  isHostInvoice: boolean;
  paymentStateKind: ChipComponent['kind'];
  invoice: ICacheable<IHostInvoice | IUserInvoice> = createICacheable();
  refundRequested: PaymentStatus = PaymentStatus.RefundPending;

  @Output() submit: EventEmitter<void> = new EventEmitter();
  @Output() cancel: EventEmitter<void> = new EventEmitter();

  constructor(
    private hostService: HostService,
    private myselfService: MyselfService,
    private helperService: HelperService,
    @Inject(MAT_DIALOG_DATA) public data: { invoice: DtoInvoice; is_host_invoice: boolean },
    private dialog: MatDialog
  ) {}

  async ngOnInit() {
    this.isHostInvoice = this.data.is_host_invoice;

    await cachize(
      this.isHostInvoice
        ? this.hostService.readInvoice(this.hostService.hostId, this.data.invoice.invoice_id)
        : this.myselfService.readInvoice(this.data.invoice.invoice_id),
      this.invoice
    );

    this.paymentStateKind = (status => {
      switch (status) {
        case PaymentStatus.Created:
          return 'blue';
        case PaymentStatus.Fufilled:
          return 'gray';
        case PaymentStatus.Paid:
          return 'green';
        case PaymentStatus.RefundPending:
          return 'magenta';
        case PaymentStatus.RefundDenied:
          return 'red';
        case PaymentStatus.Refunded:
          return 'gray';
      }
    })(this.invoice.data.status);
  }

  get hostInvoice(): IHostInvoice {
    return this.invoice.data as IHostInvoice;
  }

  requestRefund() {
    this.helperService.showDialog(this.dialog.open(RefundDialogComponent, { data: this.invoice.data }), () => {
      this.paymentStateKind = 'magenta';
      this.submit.emit();
    });
  }
}
