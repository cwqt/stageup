import { Component, OnInit, HostListener, Inject, ViewChild, AfterViewInit, ElementRef } from '@angular/core';  
import { UserService } from 'src/app/services/user.service';
import { HeaderBarComponent } from '../header-bar/header-bar.component';

@Component({
  selector: 'app-wrapper',
  templateUrl: './wrapper.component.html',
  styleUrls: ['./wrapper.component.scss'],
})
export class WrapperComponent implements OnInit {
  currentUser:any;

  constructor(private userService:UserService) {
    this.userService.currentUser.subscribe(user => this.currentUser = user );
  }

  ngOnInit(): void {
  }
}
