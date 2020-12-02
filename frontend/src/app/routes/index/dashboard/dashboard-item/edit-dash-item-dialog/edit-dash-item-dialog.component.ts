import { Component } from "@angular/core";
import { IDashboardItem } from '@cxss/interfaces';
import { Dialog } from 'src/app/_helpers/dialog.class';

@Component({
  selector: "app-edit-dash-item-dialog",
  templateUrl: "./edit-dash-item-dialog.component.html",
  styleUrls: ["./edit-dash-item-dialog.component.scss"],
})
export class EditDashItemDialogComponent extends Dialog<IDashboardItem, IDashboardItem> {
  onSubmit() { console.log(this.data) ;super.onSubmit(this.data) }
}
