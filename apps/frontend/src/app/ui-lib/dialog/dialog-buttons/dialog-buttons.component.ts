import { ThemeStyle } from '@frontend/ui-lib/ui-lib.interfaces';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { UiForm } from '../../form/form.interfaces';
import { ThemeKind } from '../../ui-lib.interfaces';

export class UiDialogButton {
  loading: boolean;
  kind: ThemeStyle;
  callback: (r?: MatDialogRef<any>) => any;
  disabled: boolean;
  label: string;
  loadingLabel?: string;

  private subscriptions: {
    changes: Subscription;
    loading: Subscription;
  };

  constructor(options: {
    label: string;
    callback: (r?: MatDialogRef<any>) => any;
    kind?: ThemeStyle;
    loading?: boolean;
    disabled?: boolean;
    loadingLabel?: string;
  }) {
    this.callback = options.callback;
    this.label = options.label;
    this.kind = options.kind || ThemeKind.Primary;
    this.loading = options.loading || false;
    this.disabled = options.disabled || false;
    this.loadingLabel = options.loadingLabel;
  }

  /**
   * @description Attach the button to the UiForm to mirror disabled/loading state
   */
  attach(form: UiForm, overrideInitialDisabledState?: boolean) {
    if (!overrideInitialDisabledState) this.disabled = !form.group.valid;

    this.subscriptions = {
      changes: form.group.valueChanges.subscribe(() => (this.disabled = !form.group.valid)),
      loading: form.loading.subscribe(state => (this.loading = state))
    };

    return this;
  }

  destroy() {
    this.subscriptions?.changes?.unsubscribe();
    this.subscriptions?.loading?.unsubscribe();
  }
}

@Component({
  selector: 'ui-dialog-buttons',
  templateUrl: './dialog-buttons.component.html',
  styleUrls: ['./dialog-buttons.component.scss']
})
export class DialogButtonsComponent implements OnInit, OnDestroy {
  @Input() dialogRef: MatDialogRef<any>;
  @Input() buttons: UiDialogButton[];
  @Input() small?: boolean;

  constructor() {}

  ngOnInit(): void {}

  ngOnDestroy() {
    this.buttons?.forEach(b => b.destroy());
  }
}
