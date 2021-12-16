import { ToastKind } from '@frontend/services/toast.service';
import { Component, Inject, OnInit } from '@angular/core';
import { MatSnackBarRef, MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';

export interface ISnackbarData {
  message: string;
  kind: ToastKind;
}

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent implements OnInit {
  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public data: ISnackbarData,
    private snackRef: MatSnackBarRef<ToastComponent>
  ) {}
  icon: string;

  ngOnInit(): void {
    this.icon =
      this.data.kind == ThemeKind.Danger
        ? 'error'
        : this.data.kind == ThemeKind.Warning
        ? 'warning--alt--filled'
        : 'checkmark--outline';
  }

  close() {
    this.snackRef.dismiss();
  }
}
