import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { ITicketStub } from '@core/interfaces';

@Component({
  selector: 'app-performance-ticket',
  templateUrl: './performance-ticket.component.html',
  styleUrls: ['./performance-ticket.component.scss']
})
export class PerformanceTicketComponent implements OnInit {
  @Input() ticket:ITicketStub;
  @Input() disabled:boolean = false;

  @Output() clicked: EventEmitter<ITicketStub> = new EventEmitter();


  constructor() { }

  ngOnInit(): void {
  }
}
