import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AngularMaterialModule } from "../angular-material.module";
import { ClickOutsideModule } from "ng-click-outside";
import { ReactiveFormsModule, FormsModule, NgForm } from "@angular/forms";

import { LoadablePanelComponent } from "./loadable-panel/loadable-panel.component";
import { ButtonMenuComponent } from "./button-menu/button-menu.component";
import { ButtonComponent } from "./button/button.component";
import { IconComponent } from "./icon/icon.component";
import { TestbedComponent } from "./testbed/testbed.component";
import { IconButtonComponent } from "./icon-button/icon-button.component";
import { OverflowMenuComponent } from "./overflow-menu/overflow-menu.component";
import { SectionHeaderComponent } from "./section-header/section-header.component";
import { AdmonitionComponent } from "./admonition/admonition.component";
import { RadioButtonComponent } from "./radio-button/radio-button.component";
import { ChipComponent } from "./chip/chip.component";
import { DialogButtonsComponent } from "./dialog-buttons/dialog-buttons.component";
import { OverlaySpinnerComponent } from "./overlay-spinner/overlay-spinner.component";
import { InputComponent } from "./input/input.component";
import { FormComponent } from './form/form.component';

export enum ButtonVariants {
  Primary = "primary",
  Secondary = "secondary",
  Accent = "accent",
  Warn = "warn",
  Disabled = "disabled",
  Basic = "basic",
}

const allComponents = [
  LoadablePanelComponent,
  ButtonMenuComponent,
  ButtonComponent,
  IconComponent,
  TestbedComponent,
  IconButtonComponent,
  OverflowMenuComponent,
  SectionHeaderComponent,
  AdmonitionComponent,
  RadioButtonComponent,
  ChipComponent,
  DialogButtonsComponent,
  OverlaySpinnerComponent,
  InputComponent,
  FormComponent
];

@NgModule({
  declarations: allComponents,
  imports: [
    CommonModule,
    AngularMaterialModule,
    ClickOutsideModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  exports: [allComponents],
  providers: [NgForm],
  entryComponents: [],
  bootstrap: [],
})
export class UiLibModule {}
