import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";

@Component({
  selector: "ui-button",
  templateUrl: "./button.component.html",
  styleUrls: ["./button.component.scss"],
})
export class ButtonComponent implements OnInit {
  @Output() click = new EventEmitter();
  @Input() tooltip?: string;
  @Input() disabled?: boolean = false;
  @Input() loading?: boolean = false;
  @Input() transparent?: boolean = false;
  @Input() variant?:
    | "primary"
    | "secondary"
    | "accent"
    | "warn"
    | "disabled"
    | "basic" = "accent";
  @Input() icon?: string;
  @Input() size?: "l" | "m" | "s";
  @Input() type?: "submit";
  @Input() fullWidth?:boolean=false;

  constructor() {}

  ngOnInit(): void {}

  onClick(event) {
    // this.click.emit(event);
  }
}
