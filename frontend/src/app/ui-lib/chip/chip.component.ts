import { Component, OnInit, Input } from "@angular/core";

@Component({
  selector: "ui-chip",
  templateUrl: "./chip.component.html",
  styleUrls: ["./chip.component.scss"],
})
export class ChipComponent implements OnInit {
  @Input() color:
    | "red"
    | "magenta"
    | "purple"
    | "blue"
    | "cyan"
    | "teal"
    | "green"
    | "gray"
    | "cool-gray"
    | "warm-gray";

  constructor() {}

  ngOnInit(): void {}
}
