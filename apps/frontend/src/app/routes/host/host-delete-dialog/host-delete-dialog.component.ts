import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTabGroup } from '@angular/material/tabs';
import { enumToValues } from '@core/helpers';
import {
  DeleteHostReason,
  IDeleteHostAssertion,
  IDeleteHostReason,
  IHost,
  IMyself,
  IPasswordConfirmationResponse
} from '@core/interfaces';
import { Cacheable } from '@frontend/app.interfaces';
import { ConfirmPasswordDialogComponent } from '@frontend/components/dialogs/confirm-password-dialog/confirm-password-dialog.component';
import { AppService } from '@frontend/services/app.service';
import { HelperService } from '@frontend/services/helper.service';
import { HostService } from '@frontend/services/host.service';
import { MyselfService } from '@frontend/services/myself.service';
import { ToastService } from '@frontend/services/toast.service';
import { UiDialogButton } from '@frontend/ui-lib/dialog/dialog-buttons/dialog-buttons.component';
import { IUiForm, IUiFormField, UiField, UiForm } from '@frontend/ui-lib/form/form.interfaces';
import { IUiDialogOptions, SecondaryButton, ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';
import { DeleteHostReasonPipe } from '@frontend/_pipes/delete-host-reason.pipe';
import { RefundReasonPipe } from '@frontend/_pipes/refund-reason.pipe';
import { NGXLogger } from 'ngx-logger';
import { merge, Observable } from 'rxjs';

@Component({
  selector: 'app-host-delete-dialog',
  templateUrl: './host-delete-dialog.component.html',
  styleUrls: ['./host-delete-dialog.component.scss']
})
export class HostDeleteDialogComponent implements OnInit, IUiDialogOptions {
  @ViewChild('tabs') tabs: MatTabGroup;
  host: IHost;
  $loading: Observable<boolean>;

  @Output() submit: EventEmitter<void>;
  @Output() cancel: EventEmitter<void>;

  assertCanDeleteHostReq = new Cacheable<IDeleteHostAssertion | void>();
  deleteConfirmationButtons: UiDialogButton[] = [
    new UiDialogButton({ label: $localize`Cancel`, kind: SecondaryButton, callback: ref => ref.close() }),
    new UiDialogButton({
      label: $localize`Yes, delete`,
      kind: ThemeKind.Danger,
      callback: async () => {
        // Do a delete with the assert_only query param, first to check if we can actually delete the host account
        await this.assertCanDeleteHostReq.request(this.hostService.deleteHost(this.host._id, null, true));
        this.tabs.selectedIndex++;
      }
    })
  ];

  reasonForLeavingForm: UiForm<IDeleteHostReason>;
  leavingReasonButtons: UiDialogButton[];

  deleteHostReq = new Cacheable();

  constructor(
    public dialogRef: MatDialogRef<HostDeleteDialogComponent>,
    private dialog: MatDialog,
    private toastService: ToastService,
    private hostService: HostService,
    private logger: NGXLogger,
    private helperService: HelperService,
    private myselfService: MyselfService,
    private appService: AppService
  ) {}

  async ngOnInit() {
    this.host = this.hostService.currentHostValue;

    const reasonPipe = new DeleteHostReasonPipe();

    this.reasonForLeavingForm = new UiForm({
      fields: {
        reasons: enumToValues(DeleteHostReason).reduce(
          (container: IUiFormField<'container'>, reason: DeleteHostReason, idx) => {
            container.options.fields[reason] = UiField.Checkbox({ label: reasonPipe.transform(reason) });
            return container;
          },
          UiField.Container({ fields: {} })
        ),
        explanation: UiField.Textarea({ label: $localize`Any additional reasons...` })
      },
      resolvers: {
        output: async v => ({
          explanation: v.explanation,
          reasons: Object.entries(v.reasons) // fields.reasons is a kv obj of { reason: boolean }
            .filter(([reason, checked]) => checked == true) // give me all checked boxes
            .map(([reason, checked]) => reason as DeleteHostReason) // and then the enum
        })
      }
    });

    this.leavingReasonButtons = [
      new UiDialogButton({ kind: ThemeKind.Secondary, label: $localize`Cancel`, callback: ref => ref.close() }),
      new UiDialogButton({
        kind: ThemeKind.Danger,
        label: $localize`Submit & Delete`,
        callback: async () => {
          this.helperService.showDialog(
            this.dialog.open(ConfirmPasswordDialogComponent),
            (res: IPasswordConfirmationResponse) => {
              if (res.is_valid) {
                this.performDeleteHost();
              }
            }
          );
        }
      }).attach(this.reasonForLeavingForm)
    ];

    this.$loading = merge(this.assertCanDeleteHostReq.$loading, this.deleteHostReq.$loading);
  }

  closeDialog() {
    this.dialogRef.close();
  }

  async performDeleteHost() {
    return (
      this.deleteHostReq
        // Get the form body via .submit()
        .request(this.hostService.deleteHost(this.host._id, await this.reasonForLeavingForm.submit()))
        .then(() => {
          this.toastService.emit($localize`Successfully deleted the company account.`);
          this.myselfService.setHost(null);
          this.appService.navigateTo('/');
          this.dialog.closeAll();
        })
        .catch(e => {
          this.toastService.emit($localize`Failed to delete the company account, please try again later...`);
          this.logger.error(e);
          this.dialog.closeAll();
        })
    );
  }
}
