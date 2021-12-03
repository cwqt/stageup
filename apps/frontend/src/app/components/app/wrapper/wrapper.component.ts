import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { IMyself } from '@core/interfaces';
import { DrawerService } from 'apps/frontend/src/app/services/drawer.service';
import { MyselfService } from 'apps/frontend/src/app/services/myself.service';

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
}
