import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { IMyself } from '@core/interfaces';
import { MyselfService } from 'apps/frontend/src/app/services/myself.service';
import { DrawerKey, DrawerService, IDrawerData } from 'apps/frontend/src/app/services/drawer.service';
import { Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { BaseAppService } from '../../../services/app.service';
import { Router, NavigationStart, ActivatedRoute } from '@angular/router';
import { filter, first } from 'rxjs/operators';
import { HelperService } from '../../../services/helper.service';
import { UserTypeClarificationComponent } from '../../../routes/landing/user-type-clarification/user-type-clarification.component';

@Component({
  selector: 'app-wrapper',
  templateUrl: './wrapper.component.html',
  styleUrls: ['./wrapper.component.scss']
})
export class AppWrapperComponent implements OnInit, AfterViewInit {
  @ViewChild('drawer') drawer: MatDrawer;

  myself: IMyself;
  drawerOpenSubject: Subject<boolean>;
  drawerKey = DrawerKey;
  drawerState: IDrawerData & { is_open: boolean } = {
    is_open: false,
    key: null,
    data: null
  };

  constructor(
    private myselfService: MyselfService,
    private drawerService: DrawerService,
    private dialog: MatDialog,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    // On first-time landing if not logged in, display confirmation dialog if at root
    if (!this.myselfService.$myself.getValue() && this.route.snapshot['_routerState'].url == '/')
      this.openConfirmationDialog();

    this.myselfService.$myself.subscribe(m => {
      this.myself = m;
    });

    this.drawerOpenSubject = this.drawerService.$drawerOpen;
    this.drawerOpenSubject.subscribe(isOpen => {
      this.drawerState = {
        is_open: isOpen,
        ...this.drawerService.drawerData
      };
    });
  }

  open() {
    this.drawerService.$drawer.value.toggle();
  }

  ngAfterViewInit() {
    this.drawerService.setDrawer(this.drawer);
  }

  openConfirmationDialog() {
    if (this.dialog.openDialogs.length == 0) {
      this.dialog.open(UserTypeClarificationComponent, {
        width: '70%',
        disableClose: true
      });
    }
  }
}
