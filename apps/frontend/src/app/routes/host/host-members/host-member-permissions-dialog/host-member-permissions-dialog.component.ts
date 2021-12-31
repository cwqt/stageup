import { Component, EventEmitter, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IUiDialogOptions, SecondaryButton, ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';
import { ToastService } from '../../../../services/toast.service';
import { HostService } from 'apps/frontend/src/app/services/host.service';
import { IUserHostInfo, HostPermission } from '@core/interfaces';
import { UiDialogButton } from 'apps/frontend/src/app/ui-lib/dialog/dialog-buttons/dialog-buttons.component';
import { IUiFieldTypeOptions, UiField, UiForm } from 'apps/frontend/src/app/ui-lib/form/form.interfaces';

@Component({
  selector: 'app-host-member-permissions-dialog',
  templateUrl: './host-member-permissions-dialog.component.html',
  styleUrls: ['./host-member-permissions-dialog.component.scss']
})
export class HostMemberPermissionsDialogComponent implements OnInit, IUiDialogOptions {
  submit: EventEmitter<string> = new EventEmitter();
  cancel: EventEmitter<string> = new EventEmitter();

  buttons: IUiDialogOptions['buttons'];
  selectedPermission: HostPermission;
  form: UiForm;

  constructor(
    private toastService: ToastService,
    private hostService: HostService,
    public dialogRef: MatDialogRef<HostMemberPermissionsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { uhi: IUserHostInfo; hostId: string }
  ) {}

  async ngOnInit(): Promise<void> {
    // Typed mapping of permissions to labels
    const allOptions: { [index in HostPermission]: string } = {
      [HostPermission.Admin]: 'Admin',
      [HostPermission.Editor]: 'Editor',
      [HostPermission.Member]: 'Member',
      [HostPermission.Owner]: 'Owner',
      [HostPermission.Expired]: 'Expired',
      [HostPermission.Pending]: 'Pending'
    } as const;

    const values = new Map<HostPermission, { label: string; disabled?: boolean }>();

    // Get a copy of the current option & set it to disabled - since you can't re-update to same permission
    values.set(this.data.uhi.permissions, { label: allOptions[this.data.uhi.permissions], disabled: true });

    // Remove all non-chooseable options
    Object.keys(allOptions)
      .filter(permission => {
        return (
          permission !== HostPermission.Owner &&
          permission !== HostPermission.Pending &&
          permission !== HostPermission.Expired &&
          permission !== this.data.uhi.permissions // or the current users permission
        ); // Put initial value back into options list
      })
      .forEach((permission: HostPermission) => values.set(permission, { label: allOptions[permission] }));

    this.form = new UiForm({
      fields: {
        permission: UiField.Select({
          label: $localize`Select Permission`,
          initial: this.data.uhi.permissions,
          validators: [{ type: 'custom', value: self => self.value != this.data.uhi.permissions }],
          multi_select: false,
          has_search: false,
          values: values
        })
      },
      resolvers: {
        output: async v => this.hostService.updateMember(this.data.hostId, this.data.uhi.user._id, v.permission)
      },
      handlers: {
        success: async () => this.submit.emit(this.selectedPermission),
        failure: async error => this.toastService.emit(error.message, ThemeKind.Danger)
      }
    });

    this.buttons = [
      new UiDialogButton({
        label: $localize`Cancel`,
        kind: SecondaryButton,
        callback: () => this.cancel.emit()
      }),
      new UiDialogButton({
        label: $localize`Update`,
        kind: ThemeKind.Primary,
        disabled: true,
        callback: () => this.form.submit()
      }).attach(this.form, true)
    ];
  }
}
