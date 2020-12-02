import { Component, OnInit, Input } from "@angular/core";

@Component({
  selector: "ui-section-header",
  templateUrl: "./section-header.component.html",
  styleUrls: ["./section-header.component.scss"],
})
export class SectionHeaderComponent implements OnInit {
  @Input() title: string;
  @Input() subtitle?: string;
  @Input() size?: "l" | "m" = "m";

  constructor() {}

  ngOnInit(): void {}
}
