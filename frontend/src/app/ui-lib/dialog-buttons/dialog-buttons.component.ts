import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";

@Component({
  selector: "ui-dialog-buttons",
  templateUrl: "./dialog-buttons.component.html",
  styleUrls: ["./dialog-buttons.component.scss"],
})
export class DialogButtonsComponent implements OnInit {
  @Input() rightString: string;
  @Input() rightVariant: string = "primary";
  @Input() rightDisabled: boolean = false;

  @Input() leftString: string;
  @Input() leftVariant: string = "secondary";
  @Input() leftDisabled: boolean = false;

  @Output() leftClick = new EventEmitter();
  @Output() rightClick = new EventEmitter();

  constructor() {}

  ngOnInit(): void {}

  onLeftClick(event) {
    this.leftClick.emit(event);
  }

  onRightClick(event) {
    this.rightClick.emit(event);
  }
}
