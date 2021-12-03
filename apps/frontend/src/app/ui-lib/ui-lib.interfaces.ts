import { EventEmitter } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { UiDialogButton } from './dialog/dialog-buttons/dialog-buttons.component';

export enum ThemeKind {
  Primary = 'primary',
  Secondary = 'secondary',
  Accent = 'accent',
  Warning = 'warning',
  Danger = 'danger',
  ClearDark = 'clear-dark',
  ClearOutline = 'clear-outline', //TODO: resolve and use the optional input for outline or fill when merging
  PrimaryLight = 'primary-light'
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
  buttons?: UiDialogButton[];
}
