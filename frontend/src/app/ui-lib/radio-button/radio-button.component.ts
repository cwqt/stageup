import { Component, OnInit, Input } from "@angular/core";

@Component({
  selector: "ui-radio-button",
  templateUrl: "./radio-button.component.html",
  styleUrls: ["./radio-button.component.scss"],
})
export class RadioButtonComponent implements OnInit {
  @Input() text: string;

  constructor() {}

  ngOnInit(): void {}
}
