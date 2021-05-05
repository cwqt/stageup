import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IHostInvoice, IUserInvoice, DtoInvoice, PaymentStatus } from '@core/interfaces';
import { cachize, createICacheable, ICacheable } from '@frontend/app.interfaces';
import { ChipComponent } from '@frontend/ui-lib/chip/chip.component';
import { PaymentStatusUiChipColorSelector } from '@frontend/routes/host/host-invoices/host-invoices.component';
import { HostService } from '@frontend/services/host.service';
import { MyselfService } from '@frontend/services/myself.service';
import { HelperService } from '@frontend/services/helper.service';
import { RefundDialogComponent } from '../refund-dialog/refund-dialog.component';

@Component({
  selector: 'app-invoice-dialog',
  templateUrl: './invoice-dialog.component.html',
  styleUrls: ['./invoice-dialog.component.scss']
})
export class InvoiceDialogComponent implements OnInit {
  public invoice: ICacheable<IHostInvoice | IUserInvoice> = createICacheable();
  isHostInvoice: boolean;
  paymentStateKind: ChipComponent['kind'];
  public refundRequested: PaymentStatus = PaymentStatus.RefundPending;

  @Output() submit: EventEmitter<void> = new EventEmitter();

  constructor(
    private hostService: HostService,
    private myselfService: MyselfService,
    private helperService: HelperService,
    @Inject(MAT_DIALOG_DATA) public data: { invoice: DtoInvoice; is_host_invoice: boolean },
    private dialog: MatDialog,
    private ref: MatDialogRef<InvoiceDialogComponent>
  ) {}

  async ngOnInit() {
    this.isHostInvoice = this.data.is_host_invoice;
    
    await cachize(
      this.isHostInvoice
        ? this.hostService.readInvoice(
            this.hostService.hostId,
            this.data.invoice.invoice_id
          )
        : this.myselfService.readInvoice(this.data.invoice.invoice_id),
      this.invoice
    );

    this.paymentStateKind = PaymentStatusUiChipColorSelector(this.invoice.data.status);
  }

  get hostInvoice(): IHostInvoice {
    return this.invoice.data as IHostInvoice;
  }

  requestRefund() {
    this.helperService.showDialog(this.dialog.open(RefundDialogComponent, { data: this.invoice.data }), 
    async () => {
      this.submit.emit();
      console.log("Refund request successful");
      this.ref.close();
    });
  }
}
