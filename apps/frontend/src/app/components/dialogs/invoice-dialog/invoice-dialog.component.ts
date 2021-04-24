import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IHostInvoice, IUserInvoice, DtoInvoice } from '@core/interfaces';
import { cachize, createICacheable, ICacheable } from '@frontend/app.interfaces';
import { ChipComponent } from '@frontend/ui-lib/chip/chip.component';
import { PaymentStatusUiChipColorSelector } from '@frontend/routes/host/host-invoices/host-invoices.component';
import { HostService } from '@frontend/services/host.service';

@Component({
  selector: 'app-invoice-dialog',
  templateUrl: './invoice-dialog.component.html',
  styleUrls: ['./invoice-dialog.component.scss']
})
export class InvoiceDialogComponent implements OnInit {
  public invoice: ICacheable<IHostInvoice | IUserInvoice> = createICacheable();
  isHostInvoice: boolean;
  paymentStateKind: ChipComponent['kind'];

  constructor(
    private hostService: HostService,
    @Inject(MAT_DIALOG_DATA) public data: { invoice: DtoInvoice; is_host_invoice: boolean }
  ) {}

  async ngOnInit() {
    this.isHostInvoice = this.data.is_host_invoice;
    await cachize(this.hostService.readInvoice(this.hostService.hostId, this.data.invoice.invoice_id), this.invoice);
    this.paymentStateKind = PaymentStatusUiChipColorSelector(this.invoice.data.status);
  }

  get hostInvoice(): IHostInvoice {
    return this.invoice.data as IHostInvoice;
  }
}
