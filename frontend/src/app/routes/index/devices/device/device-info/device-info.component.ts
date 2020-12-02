import { Component, OnInit } from "@angular/core";
import { DeviceService } from "src/app/services/device.service";
import { IDevice } from "@cxss/interfaces";

@Component({
  selector: "app-device-info",
  templateUrl: "./device-info.component.html",
  styleUrls: ["./device-info.component.scss"],
})
export class DeviceInfoComponent implements OnInit {
  device: IDevice;

  constructor(private deviceService: DeviceService) {}

  ngOnInit(): void {
    this.device = this.deviceService.lastActiveDevice.getValue();
  }
}
