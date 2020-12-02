import { Component, OnInit, Input } from "@angular/core";

const typeIconMap = {
  ["warning"]: "warning--alt--filled",
  ["info"]: "information",
  ["success"]: "checkbox--checked--filled",
  ["bug"]: "debug",
  ["example"]: "code",
  ["failure"]: "misuse",
};

@Component({
  selector: "ui-admonition",
  templateUrl: "./admonition.component.html",
  styleUrls: ["./admonition.component.scss"],
})
export class AdmonitionComponent implements OnInit {
  @Input() type: "warning" | "info" | "success" | "bug" | "example" | "failure";
  @Input() title: string;

  icon: string;

  constructor() {}

  ngOnInit(): void {
    this.icon = typeIconMap[this.type];
  }
}
