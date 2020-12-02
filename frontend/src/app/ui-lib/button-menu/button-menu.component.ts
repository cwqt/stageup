import { Component, OnInit, Input } from "@angular/core";

@Component({
  selector: "ui-button-menu",
  templateUrl: "./button-menu.component.html",
  styleUrls: ["./button-menu.component.scss"],
})
export class ButtonMenuComponent implements OnInit {
  @Input() title: string;
  @Input() pre?: string;
  @Input() variant?:
    | "primary"
    | "secondary"
    | "accent"
    | "warn"
    | "disabled"
    | "basic" = "basic";

  open: boolean = false;

  constructor() {}

  ngOnInit(): void {}

  toggleOpenState(state?: boolean) {
    if (state != undefined) {
      this.open = state;
    } else {
      this.open = !this.open;
    }
  }
}
