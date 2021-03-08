import { Component, OnInit, Inject, Output, EventEmitter, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTabGroup } from '@angular/material/tabs';
import { IEnvelopedData, IMyself, IPerformance, IPerformanceStub } from '@core/interfaces';
import { cachize, createICacheable, ICacheable } from '../../../app.interfaces';
import { RegisterDialogComponent } from '../../../routes/landing/register-dialog/register-dialog.component';
import { HelperService } from '../../../services/helper.service';
import { MyselfService } from '../../../services/myself.service';
import { PerformanceService } from '../../../services/performance.service';
import { IUiDialogOptions } from '../../../ui-lib/ui-lib.interfaces';

@Component({
  selector: 'performance-dialog',
  templateUrl: './performance-dialog.component.html',
  styleUrls: ['./performance-dialog.component.scss']
})
export class PerformanceDialogComponent implements OnInit, IUiDialogOptions {
  @Output() submit = new EventEmitter();
  @Output() cancel = new EventEmitter();
  buttons = [];

  @ViewChild('tabs') tabs: MatTabGroup;

  myself:IMyself["user"];
  performancePrice: string; // FREE or £12.50 etc.
  performanceCacheable: ICacheable<IEnvelopedData<IPerformance>> = createICacheable();
  get performance() {
    return this.performanceCacheable.data?.data;
  }

  constructor(
    private myselfService:MyselfService,
    private performanceService: PerformanceService,
    private helperService: HelperService,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<PerformanceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IPerformanceStub
  ) {}

  async ngOnInit() {
    this.myself = this.myselfService.$myself.getValue().user;
    cachize(this.performanceService.readPerformance(this.data._id), this.performanceCacheable).then(
      d => (this.performancePrice = d.data.price == 0 ? 'FREE' : `${d.data.currency}${d.data.price}`)
    );
  }

  ngAfterViewInit() {
  }

  openRegister() {
    this.helperService.showDialog(this.dialog.open(RegisterDialogComponent), () => {});
  }

  confirmPayment() {
    this.openPurchaseConfirmationSection();
  }

  openPerformanceDescriptionSection() {
    this.tabs.selectedIndex = 0;
  }

  openPurchasePerformanceSection() {
    this.tabs.selectedIndex = 1;
  }

  openPurchaseConfirmationSection() {
    this.tabs.selectedIndex = 2;
  }

  closeDialog() {
    this.dialog.closeAll();
  }
}
