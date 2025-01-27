import { EventEmitter } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { UiDialogButton } from './dialog/dialog-buttons/dialog-buttons.component';

export enum ThemeKind {
  Primary = 'primary',
  Secondary = 'secondary',
  Accent = 'accent',
  Warning = 'warning',
  Danger = 'danger',
  ClearDark = 'cleardark',
  PrimaryLight = 'primarylight'
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

export enum ThemeAppearance {
  Fill = 'fill',
  Outline = 'outline'
}

// e.g. 'primary-m-outline', 'secondary', 'l-fill' etc.
export type ThemeStyle =
  | `${ThemeKind}-${ThemeDimension}`
  | `${ThemeKind}-${ThemeAppearance}`
  | `${ThemeKind}-${ThemeDimension}-${ThemeAppearance}`
  | `${ThemeDimension}-${ThemeAppearance}`
  | ThemeKind
  | ThemeDimension
  | ThemeAppearance;
