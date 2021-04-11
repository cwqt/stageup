import { Component, EventEmitter, Inject, OnInit, Output, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTabGroup } from '@angular/material/tabs';
import {
  BASE_AMOUNT_MAP,
  DonoPeg,
  IEnvelopedData,
  IMyself,
  IPaymentIntentClientSecret,
  IPerformance,
  IPerformanceStub,
  ITicketStub
} from '@core/interfaces';
import { getDonoAmount, prettifyMoney } from '@core/shared/helpers';
import { PaymentIntent, StripeError } from '@stripe/stripe-js';
import { cachize, createICacheable, ICacheable } from '../../../app.interfaces';
import { RegisterDialogComponent } from '../../../routes/landing/register-dialog/register-dialog.component';
import { HelperService } from '../../../services/helper.service';
import { MyselfService } from '../../../services/myself.service';
import { PerformanceService } from '../../../services/performance.service';
import { FormComponent } from '../../../ui-lib/form/form.component';
import { IUiForm } from '../../../ui-lib/form/form.interfaces';
import { IUiDialogOptions, ThemeKind } from '../../../ui-lib/ui-lib.interfaces';
import { LoginComponent } from '../../landing/login/login.component';
import { PaymentCheckoutComponent } from '../../payments/payment-checkout/payment-checkout.component';

@Component({
  selector: 'performance-brochure',
  templateUrl: './performance-brochure.component.html',
  styleUrls: ['./performance-brochure.component.scss']
})
export class PerformanceBrochureComponent implements OnInit, IUiDialogOptions {
  @ViewChild('tabs') tabs: MatTabGroup;
  @ViewChild('card') card: PaymentCheckoutComponent;
  @ViewChild('donoPegForm') donoPegForm: FormComponent;
  @Output() submit = new EventEmitter();
  @Output() cancel = new EventEmitter();

  performanceCacheable: ICacheable<IEnvelopedData<IPerformance>> = createICacheable();
  paymentIntent: ICacheable<IPaymentIntentClientSecret> = createICacheable();
  stripePaymentIntent: PaymentIntent;

  myself: IMyself['user'];
  purchaserEmailAddress: string;
  cardDetailsAreValid: boolean;
  selectedTicket: ITicketStub;
  buttons = [];

  donoPegSelectForm: IUiForm<any>;
  donoPegCacheable: ICacheable<null> = createICacheable();
  selectedDonoPeg: DonoPeg;

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

    if (this.selectedTicket.type == 'dono') {
      this.donoPegSelectForm = {
        fields: {
          pegs: {
            type: 'radio',
            label: 'Select a donation amount',
            options: {
              values: new Map(
                selectedTicket.dono_pegs.map(peg => [
                  peg,
                  {
                    label:
                      peg == 'allow_any'
                        ? 'Enter an amount'
                        : prettifyMoney(getDonoAmount(peg, selectedTicket.currency), selectedTicket.currency)
                  }
                ])
              )
            }
          }
        },
        submit: {
          is_hidden: true,
          text: '',
          variant: ThemeKind.Primary,
          handler: v => v
        }
      };

      if (selectedTicket.dono_pegs.includes('allow_any')) {
        this.donoPegSelectForm.fields.allow_any_amount = {
          type: 'number',
          label: 'Enter custom amount:',
          hide: v => v.value.pegs !== 'allow_any',
          initial: 0
        };
      }
    }

    // Push setStripeElementAccountId to next change detection cycle, so that *ngIf=selectedTicket is true
    // & then on the next tick, this.card will be defined
    setTimeout(() => {
      this.card.setStripeElementAccountId(this.performance.host.stripe_account_id);
      this.tabs.selectedIndex = 1;
    }, 0);
  }

  handleCardPaymentSuccess(paymentIntent: PaymentIntent) {
    this.stripePaymentIntent = paymentIntent;
    this.openPurchaseConfirmationSection();
  }

  openPurchaseConfirmationSection() {
    this.tabs.selectedIndex = 2;
  }

  handleCardPaymentFailure(error: StripeError) {
    console.error(error);
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

  updatePayButtonWithDono(event: FormGroup) {
    this.selectedDonoPeg = event.value.pegs;
    if (this.selectedDonoPeg == 'allow_any') {
      this.selectedTicket.amount = getDonoAmount(
        'allow_any',
        this.selectedTicket.currency,
        event.value.allow_any_amount * BASE_AMOUNT_MAP[this.selectedTicket.currency]
      );
    } else {
      this.selectedTicket.amount = getDonoAmount(this.selectedDonoPeg, this.selectedTicket.currency);
    }
  }
}
