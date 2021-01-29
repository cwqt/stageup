import { Component, OnInit, HostListener, Inject, ViewChild, AfterViewInit, ElementRef } from '@angular/core';  
import { IMyself } from '@eventi/interfaces';
import { MyselfService } from 'apps/frontend/src/app/services/myself.service';
import { UserService } from 'apps/frontend/src/app/services/user.service';
import { HeaderBarComponent } from '../header-bar/header-bar.component';

@Component({
  selector: 'app-wrapper',
  templateUrl: './wrapper.component.html',
  styleUrls: ['./wrapper.component.scss'],
})
export class WrapperComponent implements OnInit {
  myself:IMyself;

  constructor(private myselfService:MyselfService) {
  }

  ngOnInit(): void {
    this.myselfService.$myself.subscribe(m => { this.myself = m });
  }
}
