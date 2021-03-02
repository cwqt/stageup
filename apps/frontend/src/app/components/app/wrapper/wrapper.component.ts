import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { IMyself } from '@core/interfaces';
import { MyselfService } from 'apps/frontend/src/app/services/myself.service';
import { DrawerKey, DrawerService, IDrawerData } from 'apps/frontend/src/app/services/drawer.service';
import { Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-wrapper',
  templateUrl: './wrapper.component.html',
  styleUrls: ['./wrapper.component.scss']
})
export class AppWrapperComponent implements OnInit, AfterViewInit {
  @ViewChild('drawer') drawer: MatDrawer;

  myself: IMyself;
  drawerOpenSubject:Subject<boolean>;
  drawerKey = DrawerKey;
  drawerState:IDrawerData & { is_open: boolean } = {
    is_open: false,
    key: null,
    data: null
  }

  constructor(private myselfService: MyselfService, private drawerService: DrawerService) {}

  ngOnInit(): void {
    this.myselfService.$myself.subscribe(m => {
      this.myself = m;
    });

    this.drawerOpenSubject = this.drawerService.$drawerOpen;
    this.drawerOpenSubject.subscribe(isOpen => {
      this.drawerState = {
        is_open: isOpen,
        ...this.drawerService.drawerData
      }
    })
  }

  open() {
    this.drawerService.$drawer.value.toggle()
  }

  ngAfterViewInit() {
    this.drawerService.setDrawer(this.drawer);
  }
}
