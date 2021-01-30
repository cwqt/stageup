import { Component, OnInit, Input, Output } from "@angular/core";
import { EventEmitter } from "events";

@Component({
  selector: "ui-icon-button",
  templateUrl: "./icon-button.component.html",
  styleUrls: ["./icon-button.component.scss"],
})
export class IconButtonComponent implements OnInit {
  @Input() variant: string;
  @Input() size: string;
  @Input() tooltip?: string;
  @Input() disabled:boolean = false;

  constructor() {}

  ngOnInit(): void {
  }
}
