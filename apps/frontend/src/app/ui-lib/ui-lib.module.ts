import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from '../angular-material.module';
import { ClickOutsideModule } from 'ng-click-outside';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgxMaskModule } from 'ngx-mask';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { NgxPopperModule } from 'ngx-popper';
import { HttpClientModule } from '@angular/common/http';
import { QuillModule } from 'ngx-quill';

import { TestbedComponent } from './testbed/testbed.component';

import { ButtonComponent } from './button/button.component';
import { IconComponent } from './icon/icon.component';
import { IconButtonComponent } from './icon-button/icon-button.component';
import { OverflowMenuComponent } from './overflow-menu/overflow-menu.component';
import { AdmonitionComponent } from './admonition/admonition.component';
import { ChipComponent } from './chip/chip.component';
import { DialogButtonsComponent } from './dialog/dialog-buttons/dialog-buttons.component';
import { OverlaySpinnerComponent } from './overlay-spinner/overlay-spinner.component';
import { InputComponent } from './input/input.component';
import { FormComponent } from './form/form.component';
import { FormBodyComponent } from './form/form-body/form-body.component';
import { HrComponent } from './hr/hr.component';
import { PlaceholderComponent } from './placeholder/placeholder.component';
import { DialogComponent } from './dialog/dialog.component';
import { TableComponent } from './table/table.component';
import { FilterStringComponent } from './table/filters/filter-string/filter-string.component';
import { FilterNumberComponent } from './table/filters/filter-number/filter-number.component';
import { FilterDateComponent } from './table/filters/filter-date/filter-date.component';
import { FilterEnumComponent } from './table/filters/filter-enum/filter-enum.component';
import { FilterBooleanComponent } from './table/filters/filter-boolean/filter-boolean.component';

const ExportedUiComponents = [
  TestbedComponent,
  ButtonComponent,
  IconComponent,
  IconButtonComponent,
  OverflowMenuComponent,
  AdmonitionComponent,
  ChipComponent,
  DialogButtonsComponent,
  OverlaySpinnerComponent,
  InputComponent,
  FormComponent,
  HrComponent,
  PlaceholderComponent,
  DialogComponent,
  TableComponent
];

@NgModule({
  declarations: [
    ...ExportedUiComponents,
    FormBodyComponent,
    FilterStringComponent,
    FilterNumberComponent,
    FilterDateComponent,
    FilterEnumComponent,
    FilterBooleanComponent
    // internal recursive component for forms
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    ClickOutsideModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    NgxMaskModule.forRoot(),
    NgxPopperModule.forRoot(),
    NgxMatSelectSearchModule,
    QuillModule.forRoot()
  ],
  exports: ExportedUiComponents,
  providers: [],
  entryComponents: [],
  bootstrap: []
})
export class UiLibModule {}
