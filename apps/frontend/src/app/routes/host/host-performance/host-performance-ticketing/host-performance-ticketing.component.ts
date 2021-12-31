import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatTableDataSource } from '@angular/material/table';
import {
  DonoPeg,
  DtoPerformance,
  IEnvelopedData,
  IHost,
  IPerformanceHostInfo,
  ITicketStub,
  NUUID,
  TICKETS_QTY_UNLIMITED
} from '@core/interfaces';
import { Cacheable, cachize, createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { HelperService } from 'apps/frontend/src/app/services/helper.service';
import { PerformanceService } from 'apps/frontend/src/app/services/performance.service';
import { ChipComponent } from 'apps/frontend/src/app/ui-lib/chip/chip.component';
import { UiDialogButton } from 'apps/frontend/src/app/ui-lib/dialog/dialog-buttons/dialog-buttons.component';
import { SecondaryButton, ThemeKind } from 'apps/frontend/src/app/ui-lib/ui-lib.interfaces';
import { IHostPerformanceComponent } from '../host-performance.component';
import { CreateUpdateTicketComponent } from './create-update-ticket/create-update-ticket.component';

@Component({
  selector: 'app-host-performance-ticketing',
  templateUrl: './host-performance-ticketing.component.html',
  styleUrls: ['./host-performance-ticketing.component.scss']
})
export class HostPerformanceTicketingComponent implements OnInit, IHostPerformanceComponent {
  // Injected from parent router outlet
  performanceId: string;
  ticketId: string;
  performanceHostInfo: ICacheable<IPerformanceHostInfo>;
  performance: Cacheable<DtoPerformance>;
  host: IHost;

  tickets: ICacheable<IEnvelopedData<ITicketStub[], NUUID[]>> = createICacheable([]);
  ticketsDataSrc: MatTableDataSource<ITicketStub>;
  displayedColumns: string[] = ['name', 'quantity', 'amount', 'actions'];
  hideTicketQuantities: boolean;
  donoPegChipMap: { [index in DonoPeg]: ChipComponent['kind'] } = {
    lowest: 'green',
    low: 'blue',
    medium: 'purple',
    high: 'magenta',
    highest: 'red',
    allow_any: 'cool-grey'
  };
  ticketLimitUnlimited = TICKETS_QTY_UNLIMITED;

  constructor(
    private dialog: MatDialog,
    private helperService: HelperService,
    private performanceService: PerformanceService
  ) {}

  ngOnInit(): void {
    this.ticketsDataSrc = new MatTableDataSource<ITicketStub>([]);
    cachize(this.performanceService.readTickets(this.performanceId), this.tickets).then(
      d => (this.ticketsDataSrc.data = d.data)
    );

    this.hideTicketQuantities = !this.performance.data.data.tickets.every(ticket => ticket.is_quantity_visible);
  }

  openCreateTicketDialog() {
    this.helperService.showDialog(
      this.dialog.open(CreateUpdateTicketComponent, { data: { operation: 'create', host: this.host } }),
      (ticket: ITicketStub) => {
        this.tickets.data.data.push(ticket);
        this.ticketsDataSrc = new MatTableDataSource(this.tickets.data.data);
      }
    );
  }

  openUpdateTicketDialog(ticket: ITicketStub) {
    this.helperService.showDialog(
      this.dialog.open(CreateUpdateTicketComponent, {
        data: { operation: 'update', ticketId: ticket._id, host: this.host }
      }),
      (ticket: ITicketStub) => {
        // Remove old ticket & replace with updated one
        this.tickets.data.data.splice(
          this.tickets.data.data.findIndex(t => t._id == ticket._id),
          1,
          ticket
        );
        this.ticketsDataSrc = new MatTableDataSource(this.tickets.data.data);
      }
    );
  }

  openDeleteTicketDialog(ticket: ITicketStub) {
    this.helperService.showConfirmationDialog(this.dialog, {
      title: 'Delete ticket',
      description: `Are you sure you want to delete ${ticket.name}`,
      buttons: [
        new UiDialogButton({
          label: 'Cancel',
          kind: SecondaryButton,
          callback: r => r.close()
        }),
        new UiDialogButton({
          label: 'Delete',
          kind: ThemeKind.Danger,
          callback: r => {
            this.performanceService.deleteTicket(this.performanceId, ticket._id);
            this.tickets.data.data.splice(
              this.tickets.data.data.findIndex(t => t._id == ticket._id),
              1
            );
            this.ticketsDataSrc = new MatTableDataSource(this.tickets.data.data);
            r.close();
          }
        })
      ]
    });
  }

  onToggleTicketsQtyVisibility(event: MatSlideToggleChange) {
    this.tickets.data.data.forEach(ticket => (ticket.is_quantity_visible = !event.checked));
    this.performanceService.bulkUpdateTicketQtyVisibility(this.performanceId, !event.checked);
  }
}
