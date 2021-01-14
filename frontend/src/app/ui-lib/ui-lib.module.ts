import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AngularMaterialModule } from "../angular-material.module";
import { ClickOutsideModule } from "ng-click-outside";
import { ReactiveFormsModule, FormsModule, NgForm } from "@angular/forms";
import { NgxMaskModule } from 'ngx-mask'

import { ButtonComponent } from "./button/button.component";
import { IconComponent } from "./icon/icon.component";
import { TestbedComponent } from "./testbed/testbed.component";
import { IconButtonComponent } from "./icon-button/icon-button.component";
import { OverflowMenuComponent } from "./overflow-menu/overflow-menu.component";
import { AdmonitionComponent } from "./admonition/admonition.component";
import { ChipComponent } from "./chip/chip.component";
import { DialogButtonsComponent } from "./dialog-buttons/dialog-buttons.component";
import { OverlaySpinnerComponent } from "./overlay-spinner/overlay-spinner.component";
import { InputComponent } from "./input/input.component";
import { FormComponent } from "./form/form.component";
import { HttpClientModule } from "@angular/common/http";
import { FormBodyComponent } from "./form/form-body/form-body.component";
import { HrComponent } from './hr/hr.component';

const allComponents = [
  ButtonComponent,
  IconComponent,
  TestbedComponent,
  IconButtonComponent,
  OverflowMenuComponent,
  AdmonitionComponent,
  ChipComponent,
  DialogButtonsComponent,
  OverlaySpinnerComponent,
  InputComponent,
  FormComponent,
  HrComponent,
];

@NgModule({
  declarations: [
    ...allComponents,
    FormBodyComponent,
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    ClickOutsideModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    NgxMaskModule.forRoot(),

  ],
  exports: allComponents,
  providers: [],
  entryComponents: [],
  bootstrap: [],
})
export class UiLibModule {}
