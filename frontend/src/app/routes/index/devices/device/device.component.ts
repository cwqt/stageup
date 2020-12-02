import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { DeviceService } from "src/app/services/device.service";
import { UserService } from "src/app/services/user.service";
import {
  IDevice,
  HardwareDevice,
  IUser,
  HardwareInformation,
} from "@cxss/interfaces";

import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { PropAssignmentsComponent } from "./prop-assignments/prop-assignments.component";
import { Popover, PopoverProperties } from "src/assets/popover";
import { DeviceMenuComponent } from "./device-menu/device-menu.component";
import { MatTabChangeEvent } from "@angular/material/tabs";
import { Subscription, BehaviorSubject } from "rxjs";

@Component({
  selector: "app-device",
  templateUrl: "./device.component.html",
  styleUrls: ["./device.component.scss"],
})
export class DeviceComponent implements OnInit {
  @ViewChild(PropAssignmentsComponent) propAssignmentComponent;
  @ViewChild("deviceRef") ref: ElementRef;

  deviceInfo: HardwareDevice;
  currentUser: IUser;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  tabs = {
    ["information"]: {
      icon: "information",
      url: "/",
      active: false,
      desc: "View recent state & edit device info",
    },
    ["properties"]: {
      icon: "api",
      url: "properties",
      active: false,
      desc: "Assign device properties to recordables",
    },
    ["measurements"]: {
      icon: "chart--bar",
      url: "measurements",
      active: false,
      desc: "View metrics, sensor & state data",
    },
    ["control"]: {
      icon: "meter",
      url: "control",
      active: false,
      desc: "Directly control device outputs",
    },
    ["task routines"]: {
      icon: "virtual-machine",
      url: "tasks",
      active: false,
      desc: "Manage and edit planned routines",
    },
  };

  cache = {
    device: {
      data: null,
      loading: false,
      error: "",
    },
  };

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private deviceService: DeviceService,
    private popover: Popover,
    private router: Router
  ) {}

  get device(): IDevice {
    return this.cache.device.data;
  }

  selectedTabChange(event: MatTabChangeEvent) {
    this.router.navigate([
      `/devices/${this.device._id}/${
        Object.values(this.tabs)[event.index].url
      }`,
    ]);
  }

  tabPositionSub: Subscription;
  async ngOnInit() {
    console.log("ngOnInit Device");

    this.currentUser = this.userService.currentUserValue;

    this.route.params
      .subscribe(async (params) => {
        console.log(params);
        await this.getDevice(params.did);

        //subscribe to change in url & get first child path to set active tab
        this.tabPositionSub = this.route.url.subscribe(() => {
          let x = (<BehaviorSubject<any>>this.route.firstChild.url).value;
          Object.values(this.tabs).forEach((t) => (t.active = false));
          let t = Object.values(this.tabs).find((t) => t.url == x[0]?.path);
          if (!t) {
            this.tabs.information.active = true;
          } else {
            t.active = true;
          }
        });

        this.cache.device.loading = false;
      })
      //unsub after initial component re-creation
      .unsubscribe();
  }

  ngOnDestroy(): void {
    this.tabPositionSub?.unsubscribe();
  }

  getDevice(device_id: string): Promise<IDevice> {
    this.cache.device.loading = true;
    return this.deviceService
      .getDevice(device_id)
      .then((device: IDevice) => {
        this.deviceInfo = HardwareInformation[device.hardware_model];
        this.cache.device.data = device;
      })
      .catch((e) => (this.cache.device.error = e))
      .finally(() => (this.cache.device.loading = false));
  }

  openDeviceMenu() {
    this.popover.load({
      event,
      component: DeviceMenuComponent,
      offset: 16,
      width: "500px",
      placement: "bottom-left",
      targetElement: this.ref.nativeElement,
    } as PopoverProperties);
  }

  asIsOrder(a, b) {
    return 1;
  }

  gotoTab(url) {
    console.log("clicked ", url);
    this.router.navigate([`/devices/${this.device._id}/${url}`]);
  }
}
