import { LocationStrategy } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { IMyself } from '@core/interfaces';
import { MyselfService } from 'apps/frontend/src/app/services/myself.service';
import { filter } from 'rxjs/operators';
import { BaseAppService } from '../../services/app.service';
import { UserType, UserTypeClarificationComponent } from './user-type-clarification/user-type-clarification.component';
import { NavigationStart, Event as NavigationEvent } from '@angular/router';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public dialog: MatDialog,
    private authService: AuthenticationService
  ) {}

  async ngOnInit() {
    // Show on landing, if not currently showing any route children
    if (this.route.children.length == 0) this.openConfirmationDialog();

    // For any future route changes (going back to root), show the dialog
    this.router.events
      .pipe(
        filter((event: NavigationEvent) => {
          return event instanceof NavigationStart;
        })
      )
      .subscribe(e => {
        if ((e as NavigationStart).url == '/') this.openConfirmationDialog();
      });
  }

  openConfirmationDialog() {
    if(this.authService.$loggedIn.getValue() == true) return;

    if(this.dialog.openDialogs.length == 0) {
      this.dialog.open(UserTypeClarificationComponent, {
        width: '70%',
        disableClose: true
      })  
    }
  }
}
