import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';
import { HelperService } from '../../../services/helper.service';

@Component({
  selector: 'app-dialog-entry',
  templateUrl: './dialog-entry.component.html',
  styleUrls: ['./dialog-entry.component.css']
})
export class DialogEntryComponent implements OnInit {
  constructor(private dialog: MatDialog, private route: ActivatedRoute, private helperService: HelperService) {}

  ngOnInit(): void {
    this.route.data.pipe(first()).subscribe(data => {
      if (data.open_dialog) this.openDialog(data.open_dialog, data.config);
    });
  }

  openDialog(dialog: any, config?:MatDialogConfig) {
    this.helperService.showDialog(this.dialog.open(dialog, config || {}), () => {});
  }
}
