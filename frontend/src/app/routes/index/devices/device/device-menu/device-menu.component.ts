import { Component, OnInit } from "@angular/core";

@Component({
  selector: "app-device-menu",
  templateUrl: "./device-menu.component.html",
  styleUrls: ["./device-menu.component.scss"],
})
export class DeviceMenuComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}

  openDeviceDeleteConfirmDialog() {}
  openDeviceEditDialog() {}
}
