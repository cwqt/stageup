import { Subject } from 'rxjs';
import { SecondaryButton, ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';
import { UiDialogButton } from '@frontend/ui-lib/dialog/dialog-buttons/dialog-buttons.component';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { HelperService } from '@frontend/services/helper.service';

@Component({
  selector: 'app-unsaved-changes-dialog',
  templateUrl: './unsaved-changes-dialog.component.html',
  styleUrls: ['./unsaved-changes-dialog.component.scss']
})
export class UnsavedChangesDialogComponent implements OnInit {
  @Output() submit: EventEmitter<any> = new EventEmitter();
  @Output() cancel: EventEmitter<void> = new EventEmitter();
  buttons: UiDialogButton[];

  constructor() {}

  ngOnInit(): void {
    this.buttons = [
      new UiDialogButton({
        kind: SecondaryButton,
        label: $localize`No`,
        callback: () => {
          this.cancel.emit();
        }
      }),
      new UiDialogButton({
        kind: ThemeKind.Primary,
        label: $localize`Save`,
        callback: async () => {
          this.submit.emit();
        }
      })
    ];
  }
}
