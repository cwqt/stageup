import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { IPaymentIntentClientSecret, IPaymentMethod, IPaymentSourceDetails, IUser } from '@core/interfaces';
import { createICacheable, ICacheable } from '@frontend/app.interfaces';
import { AppService } from '@frontend/services/app.service';
import { MyselfService } from '@frontend/services/myself.service';
import { PerformanceService } from '@frontend/services/performance.service';
import {
  StripeCardElementChangeEvent,
  StripeCardElementOptions,
  StripeElementChangeEvent,
  StripeElementsOptions
} from '@stripe/stripe-js';
import { StripeCardComponent, StripeFactoryService, StripeInstance, StripeService } from 'ngx-stripe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent implements OnInit {
  @ViewChild(StripeCardComponent) private card: StripeCardComponent;
  @Output() onChange: EventEmitter<StripeCardElementChangeEvent> = new EventEmitter();
  @Input() disabled: boolean;

  valid: boolean = false;
  focused: boolean = false;
  errored: boolean = false;
  error: StripeElementChangeEvent['error'];
  loading: boolean = false;

  stripe: StripeInstance;

  readonly elementsOptions: StripeElementsOptions = { locale: 'en-GB' };
  readonly cardOptions: StripeCardElementOptions = {
    hidePostalCode: true,
    style: {
      base: {
        fontFamily: 'Roboto, "Helvetica Neue", sans-serif',
        fontSize: '16px',
        color: '#333333',
        '::placeholder': {
          color: '#494949'
        }
      }
    }
  };

  constructor(
    private myselfService: MyselfService,
    private stripeFactory: StripeFactoryService,
    private appService: AppService
  ) {}

  ngOnInit(): void {
    this.stripe = this.stripeFactory.create(this.appService.environment.stripe_public_key);
  }

  handleOnChange(event: StripeCardElementChangeEvent) {
    this.error = event.error;
    this.errored = event.error ? true : false;
    this.valid = event.complete;
    this.onChange.emit(event);
  }

  async createPaymentMethod(billingDetails: IPaymentMethod['billing_details']['address']) {
    const response = await this.stripe
      .createPaymentMethod({
        type: 'card',
        card: this.card.element,
        billing_details: {
          address: billingDetails,
          email: this.myselfService.$myself.value.user.email_address
        },
        metadata: {
          user_id: this.myselfService.$myself.value.user._id
        }
      })
      .toPromise();

    return response;
  }
}
