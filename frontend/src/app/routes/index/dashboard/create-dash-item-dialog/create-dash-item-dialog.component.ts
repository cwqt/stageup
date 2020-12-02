import { Component, OnInit } from "@angular/core";
import { chart } from "highcharts";
import { IDashboardItem, NodeType, ChartType } from "@cxss/interfaces";
import { DashboardService } from "src/app/services/dashboard.service";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";

@Component({
  selector: "app-create-dash-item-dialog",
  templateUrl: "./create-dash-item-dialog.component.html",
  styleUrls: ["./create-dash-item-dialog.component.scss"],
})
export class CreateDashItemDialogComponent implements OnInit {
  loading: boolean = false;

  dashItem: Omit<IDashboardItem, "_id"> = {
    title: "",
    position: {
      top: 0,
      left: 0,
      width: 2,
      height: 1,
    },
    type: NodeType.DashboardItem,
    created_at: Date.now(),
    aggregation_request: {
      period: { start: new Date(), end: new Date() },
      requests: [],
    },
  };

  chartTypes = {
    ["line"]: { selected: false, icon: "chart--line" },
    ["value"]: { selected: false, icon: "string-integer" },
    ["heatmap"]: { selected: false, icon: "heat-map--03" },
  };

  constructor(
    private dialogRef: MatDialogRef<CreateDashItemDialogComponent>,
    private dashService: DashboardService
  ) {}

  ngOnInit(): void {}

  addItem() {
    this.loading = true;
    // this.dashService
    //   .addItem(
    //     this.dashItem.title,
    //     this.dashItem.position,
    //     this.dashItem.aggregation_request
    //   )
    //   .then((item: IDashboardItem) => {
    //     this.dialogRef.close(item);
    //   })
    //   .catch((e) => {
    //     this.dialogRef.close(e);
    //   })
    //   .finally(() => {
    //     this.loading = false;
    //   });
  }

  cancel() {}

  setChartType(chartKey: string) {
    Object.values(this.chartTypes).forEach((x) => (x.selected = false));
    this.chartTypes[chartKey].selected = true;
  }

  asIsOrder() {
    return 1;
  }
}
