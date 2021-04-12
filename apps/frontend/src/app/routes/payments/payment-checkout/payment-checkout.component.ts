import { Component, OnInit, Output, ViewChild, EventEmitter, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { StripeCardComponent, StripeFactoryService, StripeInstance, StripeService } from 'ngx-stripe';
import {
  PaymentIntent,
  StripeCardElementChangeEvent,
  StripeCardElementOptions,
  StripeElementChangeEvent,
  StripeElementsOptions,
  StripeError
} from '@stripe/stripe-js';
import { Subscription } from 'rxjs';
import { MyselfService } from '../../../services/myself.service';
import { DonoPeg, IPaymentIntentClientSecret, IHostStub, DtoDonationPurchase, ITicketStub } from '@core/interfaces';
import { environment } from 'apps/frontend/src/environments/environment';
import { PerformanceService } from '../../../services/performance.service';
import { cachize, createICacheable, ICacheable } from '../../../app.interfaces';

@Component({
  selector: 'app-payment-checkout',
  templateUrl: './payment-checkout.component.html',
  styleUrls: ['./payment-checkout.component.scss']
})
export class PaymentCheckoutComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(StripeCardComponent) private card: StripeCardComponent;
  @Output() onChange: EventEmitter<StripeCardElementChangeEvent> = new EventEmitter();
  @Output() onFailure: EventEmitter<StripeError> = new EventEmitter();
  @Output() onSuccess: EventEmitter<PaymentIntent> = new EventEmitter();

  private subscription: Subscription;

  paymentIntent: ICacheable<IPaymentIntentClientSecret> = createICacheable();

  public error: StripeElementChangeEvent['error'];
  public loading: boolean = false;
  stripe: StripeInstance;
  readonly elementsOptions: StripeElementsOptions = { locale: 'en-GB' };
  readonly cardOptions: StripeCardElementOptions = {
    hidePostalCode: true,
    style: {
      base: {
        fontFamily: '"Roboto", Roboto, sans-serif',
        fontSize: '18px'
      }
    }
  };

  constructor(
    private stripeFactory: StripeFactoryService,
    private myselfService: MyselfService,
    private performanceService: PerformanceService
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit() {
    this.subscription = this.card.change.subscribe(e => {
      this.error = e.error;
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  /**
   * @description Creates a stripe factory which is consumed by the Stripe card Element
   * @param stripeAccountId host stripe account id
   */
  public setStripeElementAccountId(stripeAccountId: string) {
    this.stripe = this.stripeFactory.create(environment.stripePublicKey, {
      stripeAccount: stripeAccountId
    });
  }

  /**
   * @description Finishes the transaction using the logged in users entered CC details
   */
  public async confirmPayment(ticket:ITicketStub, dto?: DtoDonationPurchase) {
		this.loading = true;
    await cachize(
      this.performanceService.createPaymentIntent(ticket, dto),
      this.paymentIntent
    );

    const myself = this.myselfService.$myself.getValue();
    return this.stripe
      .confirmCardPayment(this.paymentIntent.data.client_secret, {
        payment_method: {
          card: this.card.element,
          billing_details: {
            name: myself.user.name,
            email: myself.user.email_address
          }
        }
      })
      .toPromise()
      .then(d => {
        if (d.error) this.onFailure.emit(d.error);
        if (d.paymentIntent) this.onSuccess.emit(d.paymentIntent);
        return d;
      })
      .finally(() => (this.loading = false));
  }
}
