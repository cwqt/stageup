import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { ThemeDimension, ThemeKind } from "../ui-lib.interfaces";

@Component({
  selector: "ui-button",
  templateUrl: "./button.component.html",
  styleUrls: ["./button.component.scss"],
})
export class ButtonComponent implements OnInit {
  @Output() click = new EventEmitter();
  @Input() kind?:ThemeKind = ThemeKind.Accent;
  @Input() size?:ThemeDimension = ThemeDimension.Medium;
  @Input() tooltip?: string;
  @Input() disabled?: boolean = false;
  @Input() loading?: boolean = false;
  @Input() transparent?: boolean = false;
  @Input() icon?: string;
  @Input() type?: "submit";
  @Input() fullWidth?:boolean=false;

  constructor() {}

  ngOnInit(): void {}

  onClick(event) {
    // this.click.emit(event);
  }
}
