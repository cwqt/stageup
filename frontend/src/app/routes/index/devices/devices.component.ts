import {
  Component,
  OnInit,
  ChangeDetectorRef,
  AfterContentChecked,
  ViewChild,
  ViewChildren,
  QueryList,
} from "@angular/core";

import { IDeviceStub, Paginated } from "@cxss/interfaces";
import { OrganisationService } from "src/app/services/organisation.service";
import { Router, ActivatedRoute } from "@angular/router";
import { SelectionModel } from "@angular/cdk/collections";
import { MatTableDataSource } from "@angular/material/table";
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";
import { DeviceService } from "src/app/services/device.service";
import { THIS_EXPR } from "@angular/compiler/src/output/output_ast";
import { IconComponent } from "src/app/ui-lib/icon/icon.component";

@Component({
  selector: "app-devices",
  templateUrl: "./devices.component.html",
  styleUrls: ["./devices.component.scss"],
  animations: [
    trigger("detailExpand", [
      state("collapsed", style({ height: "0px", minHeight: "0" })),
      state("expanded", style({ height: "*" })),
      transition(
        "expanded <=> collapsed",
        animate("225ms cubic-bezier(0.4, 0.0, 0.2, 1)")
      ),
    ]),
  ],
})
export class DevicesComponent implements OnInit, AfterContentChecked {
  selectedId: string;
  selection = new SelectionModel<IDeviceStub>(true, []);
  dataSource = new MatTableDataSource<IDeviceStub>();

  @ViewChildren("dropdownIcon") dropdownIcons: QueryList<IconComponent>;

  devices = {
    data: <IDeviceStub[]>[],
    error: <string>"",
    loading: <boolean>false,
    tableRows: ["select", "name", "_id", "last_ping", "state"],
  };

  isLoadingDevice: boolean = false;
  expandedElement: IDeviceStub;

  midTransition: string;

  constructor(
    private orgService: OrganisationService,
    private router: Router,
    private route: ActivatedRoute,
    private deviceService: DeviceService,
    private cdref: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.deviceService.isLoadingDevice.subscribe((x) => {
      this.isLoadingDevice = x;
    });

    this.devices.loading = true;
    this.orgService
      .getDevices()
      .then((paginated: Paginated<IDeviceStub>) => {
        this.devices.data = paginated.results;
        this.dataSource = new MatTableDataSource<IDeviceStub>(
          this.devices.data
        );

        this.route.firstChild?.params
          .subscribe((params) => {
            console.log(params, this.devices.data, "SUBACTION");
            this.expandedElement = this.devices.data.find((d) => {
              return d._id == params.did;
            });
          })
          .unsubscribe();
      })
      .catch((e) => (this.devices.error = e))
      .finally(() => (this.devices.loading = false));
  }

  ngAfterContentChecked() {
    this.cdref.detectChanges();
  }

  openDeviceDetail(device: IDeviceStub) {
    if (this.expandedElement) {
      //use a string so only that device stays alive during transition
      //a straight boolean would cause every rows device to be created assuming
      //element == expandedElement || midTransition, use element._id == midTransition
      this.midTransition = device._id;
      setTimeout(() => {
        this.midTransition = null;
      }, 225);
    }

    if (device._id !== this.expandedElement?._id) {
      this.router.navigate([`/devices/${device._id}`]);
    }

    this.expandedElement = this.expandedElement === device ? null : device;
  }
}
