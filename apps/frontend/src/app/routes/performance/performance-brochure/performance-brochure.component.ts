import { Component, OnInit, Inject, Output, EventEmitter, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTabGroup } from '@angular/material/tabs';
import {
  IEnvelopedData,
  IMyself,
  IPaymentIntentClientSecret,
  IPerformance,
  IPerformanceStub,
  ITicketStub
} from '@core/interfaces';
import { PaymentIntent, StripeError } from '@stripe/stripe-js';
import { cachize, createICacheable, ICacheable } from '../../../app.interfaces';
import { RegisterDialogComponent } from '../../../routes/landing/register-dialog/register-dialog.component';
import { HelperService } from '../../../services/helper.service';
import { MyselfService } from '../../../services/myself.service';
import { PerformanceService } from '../../../services/performance.service';
import { IUiDialogOptions } from '../../../ui-lib/ui-lib.interfaces';
import { LoginComponent } from '../../landing/login/login.component';
import { PaymentCheckoutComponent } from '../../payments/payment-checkout/payment-checkout.component';

@Component({
  selector: 'performance-brochure',
  templateUrl: './performance-brochure.component.html',
  styleUrls: ['./performance-brochure.component.scss']
})
export class PerformanceBrochureComponent implements OnInit, IUiDialogOptions {
  @ViewChild("tabs") tabs: MatTabGroup;
  @ViewChild("card") card:PaymentCheckoutComponent;
  @Output() submit = new EventEmitter();
  @Output() cancel = new EventEmitter();

  performanceCacheable: ICacheable<IEnvelopedData<IPerformance>> = createICacheable();
  paymentIntent: ICacheable<IPaymentIntentClientSecret> = createICacheable();
  stripePaymentIntent:PaymentIntent;

  myself:IMyself["user"];
  purchaserEmailAddress: string;
  cardDetailsAreValid: boolean;
  selectedTicket: ITicketStub;
  buttons = [];

  get performance() {
    return this.performanceCacheable.data?.data;
  }

  constructor(
    private myselfService: MyselfService,
    private performanceService: PerformanceService,
    private helperService: HelperService,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<PerformanceBrochureComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IPerformanceStub
  ) {}

  async ngOnInit() {
    this.myself = this.myselfService.$myself.getValue()?.user;
    cachize(this.performanceService.readPerformance(this.data._id), this.performanceCacheable);
  }

  openPerformanceDescriptionSection() {
    this.selectedTicket = null;
    this.paymentIntent.data = null;
    this.paymentIntent.error = null;
    this.tabs.selectedIndex = 0;
  }

  openPurchaseTicketSection(selectedTicket: ITicketStub) {
    this.selectedTicket = selectedTicket;
    this.tabs.selectedIndex = 1;
    cachize(this.performanceService.createPaymentIntent(this.selectedTicket), this.paymentIntent)
      .then(pi => this.card.setPaymentIntent(pi));
  }


  handleCardPaymentSuccess(paymentIntent:PaymentIntent) {
    this.stripePaymentIntent = paymentIntent;
    this.openPurchaseConfirmationSection();
  }

  openPurchaseConfirmationSection() {
    this.tabs.selectedIndex = 2;
  }

  handleCardPaymentFailure(error:StripeError) {
    console.error(error) 
  }

  closeDialog() {
    this.dialog.closeAll();
  }

  openRegister() {
    this.helperService.showDialog(this.dialog.open(RegisterDialogComponent), () => {});
  }
  openLogin() {
    this.helperService.showDialog(this.dialog.open(LoginComponent), () => {});
  }
}
