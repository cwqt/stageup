import {
  DtoAccessToken,
  IEnvelopedData,
  IHost,
  IPerformance,
  IPerformanceHostInfo,
  ITicketStub
} from '@core/interfaces';
import { cachize, createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { PerformanceService } from 'apps/frontend/src/app/services/performance.service';
import { HelperService } from 'apps/frontend/src/app/services/helper.service';
import { MatDialog } from '@angular/material/dialog';
import { CreateUpdateTicketComponent } from './create-update-ticket/create-update-ticket.component';

@Component({
  selector: 'app-host-performance-ticketing',
  templateUrl: './host-performance-ticketing.component.html',
  styleUrls: ['./host-performance-ticketing.component.scss']
})
export class HostPerformanceTicketingComponent implements OnInit {
  // Injected from parent router outlet
  performanceId: string;
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

  openUpdateTicketDialog(ticketId: string) {
    this.helperService.showDialog(
      this.dialog.open(CreateUpdateTicketComponent, { data: { operation: 'update', ticketId } }),
      (ticket: ITicketStub) => {
        // Remove old ticket & replace with updated one
        this.tickets.data.splice(this.tickets.data.findIndex(t => t._id == ticketId), 1, ticket);
        this.ticketsDataSrc = new MatTableDataSource(this.tickets.data);
      }
    );
  }
}
