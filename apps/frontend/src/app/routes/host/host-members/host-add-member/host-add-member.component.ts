import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { IUiDialogOptions, ThemeKind } from 'apps/frontend/src/app/ui-lib/ui-lib.interfaces';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { HostService } from 'apps/frontend/src/app/services/host.service';
import { IHostMemberChangeRequest, IUserHostInfo } from '@core/interfaces';
import { cachize, createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { UiDialogButton } from 'apps/frontend/src/app/ui-lib/dialog/dialog-buttons/dialog-buttons.component';

export interface Fruit {
  name: string;
}

@Component({
  selector: 'app-host-add-member',
  templateUrl: './host-add-member.component.html',
  styleUrls: ['./host-add-member.component.scss']
})
export class HostAddMemberComponent implements OnInit, IUiDialogOptions {
  @Output() cancel = new EventEmitter();
  @Output() submit = new EventEmitter();

  constructor(private hostService: HostService) {}
  buttons = [
    new UiDialogButton({
      label: 'Cancel',
      kind: ThemeKind.Secondary,
      callback: () => this.cancel.emit()
    }),
    new UiDialogButton({
      label: 'Send Requests',
      kind: ThemeKind.Primary,
      loading: false,
      disabled: true,
      callback: () => this.submitMembershipRequests()
    })
  ];

  addedMembers: ICacheable<IUserHostInfo[]> = createICacheable([]);
  addedChangeRequests: IHostMemberChangeRequest[] = [];
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  ngOnInit(): void {}

  async submitMembershipRequests() {
    const newUsers = await cachize(
      Promise.allSettled(
        this.addedChangeRequests
          // Remove duplicates to avoid sending extra requests
          .filter((v, i, a) => a.findIndex(t => t.value === v.value) === i)
          .map(e => this.hostService.addMember(this.hostService.hostId, e))
      ),
      this.addedMembers,
      members =>
        members
          // TODO: emit toasts for errors on failed requests
          // .forEach(c => if(c.status == "rejected") )
          .filter(c => c.status === 'fulfilled')
          .map(m => <PromiseFulfilledResult<IUserHostInfo>>m)
          .map(m => m.value)
    );

    // Pass up all successful membership requests back to the dialog opener
    this.submit.emit(newUsers);
  }

  add(event: MatChipInputEvent): void {
    // Add new email
    if ((event.value || '').trim()) this.addedChangeRequests.push({ value: event.value.trim() });
    // Reset the input value
    if (event.input) event.input.value = '';
    this.setDialogDisabledState();
  }

  remove(req: IHostMemberChangeRequest): void {
    const index = this.addedChangeRequests.indexOf(req);
    if (index >= 0) this.addedChangeRequests.splice(index, 1);
    this.setDialogDisabledState();
  }

  setDialogDisabledState() {
    this.buttons[1].disabled = this.addedChangeRequests.length === 0;
  }
}
