import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { IUiDialogOptions } from "../../ui-lib.interfaces";

@Component({
  selector: "ui-dialog-buttons",
  templateUrl: "./dialog-buttons.component.html",
  styleUrls: ["./dialog-buttons.component.scss"],
})
export class DialogButtonsComponent implements OnInit {
  @Input() dialogRef:MatDialogRef<any>;
  @Input() buttons:IUiDialogOptions["buttons"];
  @Input() small?:boolean;

  constructor() {}

  ngOnInit(): void {}
}
