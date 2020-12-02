import { TOUCH_BUFFER_MS } from '@angular/cdk/a11y';
import { ThrowStmt } from '@angular/compiler';
import { Component, OnInit, Input } from "@angular/core";
import { IDashboardItem } from "@cxss/interfaces";
import { IoTService } from "src/app/services/iot.service";

@Component({
  selector: "app-dashboard-item",
  templateUrl: "./dashboard-item.component.html",
  styleUrls: ["./dashboard-item.component.scss"],
})
export class DashboardItemComponent implements OnInit {
  @Input() item: IDashboardItem;

  constructor(private iotService: IoTService) {}

  ngOnInit(): void {}
}
