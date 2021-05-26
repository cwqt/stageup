import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';
import { HelperService } from '../../../services/helper.service';
import merge from 'deepmerge';
import { BaseAppService } from '@frontend/services/app.service';
import { Subject, Subscription } from 'rxjs';

@Component({
  selector: 'app-dialog-entry',
  templateUrl: './dialog-entry.component.html',
  styleUrls: ['./dialog-entry.component.css']
})
export class DialogEntryComponent implements OnInit, OnDestroy {
  private _subAfterClosed: Subscription;
  constructor(private dialog: MatDialog, private route: ActivatedRoute, private appService: BaseAppService) {}

  ngOnInit(): void {
    this.route.data.pipe(first()).subscribe(data => {
      if (data.open_dialog) this.openDialog(data.open_dialog, data.config);
    });
  }

  openDialog(dialog: any, config?: MatDialogConfig) {
    // Pass route along into dialog because they're opened outside the component tree
    // https://github.com/angular/components/issues/13803
    const ref = this.dialog.open(dialog, { ...(config || {}), data: { ...(config.data || {}), route: this.route } });
    this._subAfterClosed = ref.afterClosed().subscribe(() => {
      this.appService.navigateTo('../');
    });
  }

  ngOnDestroy() {
    this._subAfterClosed.unsubscribe();
  }
}
