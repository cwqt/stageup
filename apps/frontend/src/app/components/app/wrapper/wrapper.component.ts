import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDrawer } from '@angular/material/sidenav';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { IMyself } from '@core/interfaces';
import { DrawerKey, DrawerService, IDrawerData } from 'apps/frontend/src/app/services/drawer.service';
import { MyselfService } from 'apps/frontend/src/app/services/myself.service';
import { Subject } from 'rxjs';
import { UserTypeClarificationComponent } from '../../../routes/landing/user-type-clarification/user-type-clarification.component';

@Component({
  selector: 'app-wrapper',
  templateUrl: './wrapper.component.html',
  styleUrls: ['./wrapper.component.scss']
})
export class AppWrapperComponent implements OnInit, AfterViewInit {
  @ViewChild('scrollContainer') scrollContainer: ElementRef;

  myself: IMyself;

  constructor(
    private myselfService: MyselfService,
    private drawerService: DrawerService,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    // On first-time landing if not logged in, display confirmation dialog if at root
    if (!this.myselfService.$myself.getValue() && this.route.snapshot['_routerState'].url == '/')
      this.openConfirmationDialog();

    this.myselfService.$myself.subscribe(m => {
      this.myself = m;
    });
  }

  open() {
    this.drawerService.$drawer.value.toggle();
  }

  ngAfterViewInit() {
    // handle scroll to top of scrollable element on router transitions
    this.router.events.subscribe(evt => {
      if (!(evt instanceof NavigationEnd)) return;
      this.scrollContainer.nativeElement.scrollTo(0, 0);
    });
  }

  openConfirmationDialog() {
    if (this.dialog.openDialogs.length == 0) {
      this.dialog.open(UserTypeClarificationComponent, {
        disableClose: true,
        backdropClass: 'dialog-opaque'
      });
    }
  }
}
