import { Component, OnInit, Input, ViewChild, ElementRef } from "@angular/core";
import { IUser } from "@eventi/interfaces";
import { ButtonVariants } from "src/app/ui-lib/ui-lib.module";
import { Popover, PopoverProperties } from "src/assets/popover";
import { HeaderBarUserMenuComponent } from "../header-bar-user-menu/header-bar-user-menu.component";

@Component({
  selector: "app-header-user-button",
  templateUrl: "./header-user-button.component.html",
  styleUrls: ["./header-user-button.component.scss"],
})
export class HeaderUserButtonComponent implements OnInit {
  @Input() currentUser: IUser;
  @Input() variant?: ButtonVariants = ButtonVariants.Accent;
  @Input() transparent: boolean = false;

  @ViewChild("ref") ref: ElementRef;

  constructor(private popover: Popover) {}

  ngOnInit(): void {}

  openUserMenu(event) {
    this.popover.load({
      event,
      component: HeaderBarUserMenuComponent,
      offset: 16,
      width: "500px",
      placement: "bottom-left",
      targetElement: this.ref.nativeElement,
    } as PopoverProperties);
  }
}
