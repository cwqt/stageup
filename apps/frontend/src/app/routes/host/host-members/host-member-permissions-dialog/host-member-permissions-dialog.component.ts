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

  initialPermission: any;
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
    const options: IUiFieldSelectOptions = {
      multi: false,
      search: false,
      values: [
        // All possible permission options
        { value: HostPermission.Admin, key: 'Admin' },
        { value: HostPermission.Editor, key: 'Editor' },
        { value: HostPermission.Member, key: 'Member' },
        { value: HostPermission.Owner, key: 'Owner' },
        { value: HostPermission.Expired, key: 'Expired' },
        { value: HostPermission.Pending, key: 'Pending' }
      ]
    };

    // Get a copy of the current option & set it to disabled - since you can't re-update to same permission
    this.initialPermission = { ...options.values.find(o => o.value == this.data.uhi.permissions), disabled: true };

    // Remove all non-chooseable options
    options.values = options.values.filter(o => {
      return (
        o.value !== HostPermission.Owner &&
        o.value !== HostPermission.Pending &&
        o.value !== HostPermission.Expired &&
        o.value !== this.initialPermission.value // or the current users permission
      );
    });

    // Put initial value back into options list
    options.values.push(this.initialPermission);

    // Set ui-select options
    this.selectFieldOptions = options;
  }

  onSelectionChange(event: { value: HostPermission; key: string }) {
    this.selectedPermission = event.value;
    if (event.value !== this.initialPermission.value) {
      this.buttons[1].disabled = false;
    } else {
      this.buttons[1].disabled = true;
    }
  }
}
