import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IMyself } from '@core/interfaces';
import { ToastService } from '@frontend/services/toast.service';
import { MyselfService } from 'apps/frontend/src/app/services/myself.service';
import { BaseAppService } from '../../../services/app.service';
import { HelperService } from '../../../services/helper.service';
import { HostService } from '../../../services/host.service';
import { UiDialogButton } from '../../../ui-lib/dialog/dialog-buttons/dialog-buttons.component';
import { ThemeKind } from '../../../ui-lib/ui-lib.interfaces';

@Component({
  selector: 'app-host-settings',
  templateUrl: './host-settings.component.html',
  styleUrls: ['./host-settings.component.scss']
})
export class HostSettingsComponent implements OnInit {
  myself: IMyself;

  constructor(
    private dialog: MatDialog,
    private helperService: HelperService,
    private myselfService: MyselfService,
    private hostService: HostService,
    private toastService: ToastService,
    private baseAppService: BaseAppService
  ) {}

  ngOnInit(): void {
    this.myself = this.myselfService.$myself.getValue();
  }

  openLeaveHostConfirmationDialog() {
    this.helperService.showConfirmationDialog(this.dialog, {
      title: `Leave '${this.myself.host.name}'`,
      description: 'Are you sure you want to leave this host?',
      buttons: [
        new UiDialogButton({
          label: 'Cancel',
          kind: ThemeKind.Secondary,
          callback: r => r.close()
        }),
        new UiDialogButton({
          label: 'Yes',
          kind: ThemeKind.Danger,
          callback: r => {
            this.hostService
              .removeMember(this.myself.host._id, this.myself.user._id)
              .then(() => this.toastService.emit($localize`Successfully left company`))
              .catch(() =>
                this.toastService.emit(
                  $localize`An error occured while trying to leave, try again later`,
                  ThemeKind.Danger
                )
              );

            this.baseAppService.navigateTo('/settings');
            r.close();
          }
        })
      ]
    });
  }
}
