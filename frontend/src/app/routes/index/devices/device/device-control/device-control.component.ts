import { Component, OnInit, Input } from "@angular/core";
import { DeviceService } from "src/app/services/device.service";

import { IDevice, IUser, IDeviceProperty, NodeType } from "@cxss/interfaces";

@Component({
  selector: "app-device-control",
  templateUrl: "./device-control.component.html",
  styleUrls: ["./device-control.component.scss"],
})
export class DeviceControlComponent implements OnInit {
  @Input() currentUser: IUser;
  @Input() authorUser: IUser;
  device: IDevice;

  displayedColumns: string[] = ["ref", "name", "set-value"];
  cache = {
    states: {
      data: undefined,
      loading: true,
      error: "",
    },
  };

  constructor(private deviceService: DeviceService) {}

  ngOnInit(): void {
    this.device = this.deviceService.lastActiveDevice.getValue();
    this.getDeviceStates(this.device._id);
  }

  getDeviceStates(
    device_id: string
  ): Promise<IDeviceProperty<NodeType.State>[]> {
    this.cache.states.loading = true;
    return this.deviceService
      .getDeviceProperties(NodeType.State, device_id)
      .then(
        (states: IDeviceProperty<NodeType.State>[]) =>
          (this.cache.states.data = states)
      )
      .catch((e) => (this.cache.states.error = e))
      .finally(() => (this.cache.states.loading = false));
  }
}
