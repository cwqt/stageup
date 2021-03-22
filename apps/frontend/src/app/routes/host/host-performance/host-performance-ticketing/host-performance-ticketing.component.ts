import {
  DtoAccessToken,
  IEnvelopedData,
  IHost,
  IPerformance,
  IPerformanceHostInfo,
  ITicketStub,
  ITicket
} from '@core/interfaces';
import { cachize, createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { PerformanceService } from 'apps/frontend/src/app/services/performance.service';
import { HelperService } from 'apps/frontend/src/app/services/helper.service';
import { MatDialog } from '@angular/material/dialog';
import { CreateUpdateTicketComponent } from './create-update-ticket/create-update-ticket.component';
import { ThemeKind } from 'apps/frontend/src/app/ui-lib/ui-lib.interfaces';

@Component({
  selector: 'app-host-performance-ticketing',
  templateUrl: './host-performance-ticketing.component.html',
  styleUrls: ['./host-performance-ticketing.component.scss']
})
export class HostPerformanceTicketingComponent implements OnInit {
  // Injected from parent router outlet
  performanceId: string;
  ticketId: string;
  performanceHostInfo: ICacheable<IPerformanceHostInfo>;
  performance: ICacheable<IEnvelopedData<IPerformance, DtoAccessToken>>;
  host: IHost;

  tickets: ICacheable<ITicketStub[]> = createICacheable([]);
  ticketsDataSrc: MatTableDataSource<ITicketStub>;
  displayedColumns: string[] = ['name', 'quantity', 'amount', 'actions'];

  constructor(
    private dialog: MatDialog,
    private helperService: HelperService,
    private performanceService: PerformanceService
  ) {}

  ngOnInit(): void {
    this.ticketsDataSrc = new MatTableDataSource<ITicketStub>([]);
    cachize(this.performanceService.readTickets(this.performanceId), this.tickets).then(
      d => (this.ticketsDataSrc.data = d)
    );
  }

  openCreateTicketDialog() {
    this.helperService.showDialog(
      this.dialog.open(CreateUpdateTicketComponent, { data: { operation: 'create' } }),
      (ticket: ITicketStub) => {
        this.tickets.data.push(ticket);
        this.ticketsDataSrc = new MatTableDataSource(this.tickets.data);
      }
    );
  }

  openUpdateTicketDialog(ticket: ITicketStub) {
    this.helperService.showDialog(
      this.dialog.open(CreateUpdateTicketComponent, { data: { operation: 'update', ticketId: ticket._id } }),
      (ticket: ITicketStub) => {
        // Remove old ticket & replace with updated one
        this.tickets.data.splice(
          this.tickets.data.findIndex(t => t._id == ticket._id),
          1,
          ticket
        );
        this.ticketsDataSrc = new MatTableDataSource(this.tickets.data);
      }
    );
  }

  openDeleteTicketDialog(ticket: ITicketStub) {
    this.helperService.showConfirmationDialog(this.dialog, {
      title: 'Delete ticket',
      description: `Are you sure you want to delete ${ticket.name}`,
      buttons: [
        {
          text: 'Cancel',
          kind: ThemeKind.Secondary,
          callback: r => r.close()
        },
        {
          text: 'Delete',
          kind: ThemeKind.Danger,
          callback: r => {
            this.performanceService.deleteTicket(this.performanceId, ticket._id);
            this.tickets.data.splice(
              this.tickets.data.findIndex(t => t._id == ticket._id),
              1
            );
            this.ticketsDataSrc = new MatTableDataSource(this.tickets.data);
            r.close();
          }
        }
      ]
    });
  }
}
