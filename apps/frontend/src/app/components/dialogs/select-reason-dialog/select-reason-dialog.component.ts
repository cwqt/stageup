import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ISelectReasonData } from '@core/interfaces';
import { UiField, UiForm } from '@frontend/ui-lib/form/form.interfaces';

@Component({
  selector: 'frontend-select-reason-dialog',
  templateUrl: './select-reason-dialog.component.html',
  styleUrls: ['./select-reason-dialog.component.css']
})
export class SelectReasonDialogComponent implements OnInit {
  public selectReasonForm: UiForm;

  constructor(@Inject(MAT_DIALOG_DATA) public data: ISelectReasonData, public ref: MatDialog) {}

  ngOnInit(): void {
    this.selectReasonForm = new UiForm({
      fields: {
        select_reason: UiField.Select({
          values: null,
          validators: [{ type: 'required' }]
        })
      },
      resolvers: null,
      handlers: null
    });
  }
}
