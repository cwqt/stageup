import { Component, OnInit, ViewChild, AfterViewInit, ElementRef } from "@angular/core";
import { OrganisationService } from "src/app/services/organisation.service";
import { IDashboard, IOrg, IDashboardItem } from "@cxss/interfaces";
import { MatDialog } from "@angular/material/dialog";
import { CreateDashItemDialogComponent } from "./create-dash-item-dialog/create-dash-item-dialog.component";
import { DashboardService } from "src/app/services/dashboard.service";
import { Rectangle } from "ngx-widget-grid";
import { EditDashItemDialogComponent } from "./dashboard-item/edit-dash-item-dialog/edit-dash-item-dialog.component";
import { HelperService } from "src/app/services/helper.service";
@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild("myPopover", { static: false }) myPopover;
  @ViewChild("grid") grid:ElementRef;

  gridHeight = 100;

  cache = {
    dashboard: {
      data: null,
      editing: false,
      loading: false,
      error: "",
    },
  };

  openedDashMenuItem: IDashboardItem;
  org: IOrg;

  get dashboard() {
    return this.cache.dashboard.data;
  }

  constructor(
    private helper: HelperService,
    private dialog: MatDialog,
    private orgService: OrganisationService,
    private dashService: DashboardService
  ) {}

  async ngOnInit(): Promise<void> {
    this.orgService.currentOrg.subscribe((o) => (this.org = o));
    await this.getDashboard();
    this.editDashItem(this.dashboard.items[0]);
  }

  ngAfterViewInit() {
    // this.openAddDashItemDialog();
    // setTimeout(() => console.log('-->', this.grid), 1000)
  }

  openAddDashItemDialog() {
    const dialogRef = this.dialog.open(CreateDashItemDialogComponent);

    dialogRef.afterClosed().subscribe((result) => {
      this.getDashboard();
    });
  }

  deleteDashItem(item: IDashboardItem = this.openedDashMenuItem) {
    this.dashboard.items.splice(
      this.dashboard.items.findIndex((i) => i._id == item._id),
      1
    );
    this.dashService.deleteItem(item._id).then(() => {
      this.getDashboard();
    });
  }

  editDashItem(item: IDashboardItem = this.openedDashMenuItem) {
    this.helper.showDialog<IDashboardItem>(
      this.dialog.open(EditDashItemDialogComponent, {
        data: item,
      }),
      (newItem) => {
        this.dashService.updateItem(item._id, newItem as any)
      }
    );
  }

  updateDashItem(item: IDashboardItem, body: { [index: string]: any }) {
    this.dashService.updateItem(item._id, body);
  }

  handleDashPositionChanged(item: IDashboardItem, position: Rectangle) {
    const oldPosition = this.dashboard.items.find((x) => x._id == item._id)
      .position;

    if (position.top != oldPosition.top || position.left != oldPosition.left) {
      this.updateDashItem(item, { position: position });
    }
  }

  openDashItemEditMenu(item) {
    this.openedDashMenuItem = item;
  }

  getDashboard(): Promise<void> {
    this.cache.dashboard.loading = true;
    return this.orgService
      .getDashboard()
      .then((d: IDashboard) => {
        this.cache.dashboard.data = d;
      })
      .catch((e) => (this.cache.dashboard.error = e.message))
      .finally(() => (this.cache.dashboard.loading = false));
  }

  onWidgetChange(event) {
    // console.log(event);
  }

  toggleEditState() {
    if (this.cache.dashboard.editing) {
      console.log("saving state");
    }
    this.cache.dashboard.editing = !this.cache.dashboard.editing;
  }

  cancelEdit() {
    this.cache.dashboard.editing = false;
  }
}
