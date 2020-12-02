import {
  Component,
  OnInit,
  Input,
  AfterViewInit,
  ViewChild,
} from "@angular/core";
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";
import * as Highcharts from "highcharts";

import {
  IDeviceStub,
  IUser,
  IDeviceProperty,
  NodeType,
  IMeasurementResult,
  IDevice,
  IMeasurement,
} from "@cxss/interfaces";

import { DeviceService } from "src/app/services/device.service";
import { IoTService } from "src/app/services/iot.service";

interface Cacheable<T> {
  data: T;
  chartData?: Highcharts.Options;
  imageData?: any;
  loading: boolean;
  error: string;
  expandedElement?: any;
}

@Component({
  selector: "app-property-list",
  templateUrl: "./property-list.component.html",
  styleUrls: ["./property-list.component.scss"],
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
export class PropertyListComponent implements OnInit, AfterViewInit {
  Highcharts: typeof Highcharts = Highcharts; // required

  @Input() currentUser: IUser;
  @Input() authorUser: IUser;

  device: IDevice;
  columnsToDisplay = ["name", "_id", "ref", "value"];

  cache: {
    [NodeType.Sensor]: Cacheable<Cacheable<IDeviceProperty<any>>[]>;
    [NodeType.State]: Cacheable<Cacheable<IDeviceProperty<any>>[]>;
    [NodeType.Metric]: Cacheable<Cacheable<IDeviceProperty<any>>[]>;
  } = {
    [NodeType.Sensor]: {
      data: [],
      loading: false,
      error: "",
      expandedElement: null,
    },
    [NodeType.State]: {
      data: [],
      loading: false,
      error: "",
      expandedElement: null,
    },
    [NodeType.Metric]: {
      data: [],
      loading: false,
      error: "",
      expandedElement: null,
    },
  };

  constructor(
    private deviceService: DeviceService,
    private iotService: IoTService
  ) {}

  ngOnInit(): void {
    this.device = this.deviceService.lastActiveDevice.getValue();
    console.log(this.device);
  }

  ngAfterViewInit() {
    // this.getProperty(NodeType.State); //first tab
    this.getProperty(NodeType.Sensor); //first tab
  }

  pretty(str: string) {
    return (str.charAt(0).toUpperCase() + str.slice(1)).replace("_", " ");
  }

  getProperty(propType: NodeType.State | NodeType.Sensor | NodeType.Metric) {
    this.cache[propType].loading = true;
    this.deviceService
      .getDeviceProperties(propType, this.device._id)
      .then((props) => {
        this.cache[propType].data = props.map<Cacheable<any>>((x) => {
          return {
            loading: false,
            data: x,
            error: "",
          };
        });
        console.log(this.cache[propType].data);
      })
      .catch((e) => (this.cache[propType].error = e))
      .finally(() => (this.cache[propType].loading = false));
  }

  getPropertyData(property: Cacheable<IDeviceProperty<any>>) {
    // const m: Cacheable<IDeviceProperty<any>> = (this.cache[property.type]
    //   .data as any[]).find((x: IDeviceProperty<any>) => {
    //   return x._id == property._id;
    // });

    property.loading = true;

    setTimeout(() => {
      this.iotService
        .query(
          `measurement=${property.data.measures}&property=${property.data.type}-${property.data._id}`
        )
        .then((d: IMeasurement) => {
          if (property.data.data_format == "image") {
            property.imageData = d[property.data.measures];
            property.imageData.values = property.imageData.values.map((url) => {
              return {
                path: "https://mcn-images.s3.eu-west-2.amazonaws.com/" + url,
              };
            });
            console.log(property.imageData);
          } else {
            property.chartData = {
              title: null,
              xAxis: {
                title: { text: "Date" },
                type: "datetime",
                categories: d.times.map((x) => x.toString()),
              },
              series: [
                {
                  name: "Relative Humidity (%)",
                  data: d.values as any[],
                  type: "line",
                },
              ],
            };
          }
        })
        .finally(() => (property.loading = false));
    }, 100);
  }
}
