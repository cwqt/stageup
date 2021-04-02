import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { ITicketStub, TicketType } from '@core/interfaces';
import { ChipComponent } from '../../../ui-lib/chip/chip.component';

@Component({
  selector: 'app-performance-ticket',
  templateUrl: './performance-ticket.component.html',
  styleUrls: ['./performance-ticket.component.scss']
})
export class PerformanceTicketComponent implements OnInit {
  @Input() ticket:ITicketStub;
  @Input() disabled:boolean = false;

  @Output() clicked: EventEmitter<ITicketStub> = new EventEmitter();


  ticketChipColor:{[index in TicketType]:ChipComponent['kind']} = {
    [TicketType.Paid]: "red",
    [TicketType.Donation]: "blue",
    [TicketType.Free]: "green"
  }

  constructor() { }

  ngOnInit(): void {
  }
}
