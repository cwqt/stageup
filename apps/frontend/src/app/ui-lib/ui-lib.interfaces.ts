import { EventEmitter } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

export enum ThemeKind {
  Primary = 'primary',
  Secondary = 'secondary',
  Accent = 'accent',
  Warning = 'warning',
  Danger = 'danger'
}

export enum ThemeDimension {
  Large = 'l',
  Medium = 'm',
  Small = 's'
}

export const dimensionClassMap: { [index in ThemeDimension]: string } = {
  [ThemeDimension.Large]: 'large',
  [ThemeDimension.Medium]: 'medium',
  [ThemeDimension.Small]: 'small'
};

export interface IUiDialogOptions {
  submit: EventEmitter<any>;
  cancel: EventEmitter<any>;
  buttons: Array<{
    text: string;
    kind: ThemeKind;
    callback: (r?:MatDialogRef<any>) => any;
    loading?: boolean;
    disabled?: boolean;
    loadingText?: string;
  }>;
}
