import { Component, EventEmitter, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IUiDialogOptions, ThemeKind } from '../../../../ui-lib/ui-lib.interfaces';
import { ToastService } from '../../../../services/toast.service';
import { HostService } from 'apps/frontend/src/app/services/host.service';
import { IUiFieldSelectOptions } from '../../../../ui-lib/form/form.interfaces';
import { IUserHostInfo, HostPermission } from '@core/interfaces';

@Component({
  selector: 'app-host-member-permissions-dialog',
  templateUrl: './host-member-permissions-dialog.component.html',
  styleUrls: ['./host-member-permissions-dialog.component.scss']
})
export class HostMemberPermissionsDialogComponent implements OnInit, IUiDialogOptions {
  submit: EventEmitter<string> = new EventEmitter();
  cancel: EventEmitter<string> = new EventEmitter();

  selectedPermission: HostPermission;
  selectFieldOptions: IUiFieldSelectOptions;

  buttons: IUiDialogOptions['buttons'] = [
    {
      text: 'Cancel',
      kind: ThemeKind.Secondary,
      callback: () => this.cancel.emit()
    },
    {
      text: 'Update',
      disabled: true,
      kind: ThemeKind.Primary,
      callback: () =>
        this.hostService
          .updateMember(this.data.hostId, this.data.uhi.user._id, this.selectedPermission)
          .then(() => this.submit.emit(this.selectedPermission))
          .catch(error => this.toastService.emit(error, ThemeKind.Danger))
    }
  ];

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

    const options: IUiFieldSelectOptions = {
      multi: false,
      search: false,
      values: new Map<HostPermission, { label: string; disabled?: boolean }>()
    };

    // Get a copy of the current option & set it to disabled - since you can't re-update to same permission
    options.values.set(this.data.uhi.permissions, { label: allOptions[this.data.uhi.permissions], disabled: true });

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
      .forEach(permission => options.values.set(permission, { label: allOptions[permission] }));

    // Set ui-select options
    this.selectFieldOptions = options;
  }

  onSelectionChange(event: HostPermission) {
    this.selectedPermission = event;
    if (event !== this.data.uhi.permissions) {
      this.buttons[1].disabled = false;
    } else {
      this.buttons[1].disabled = true;
    }
  }
}
