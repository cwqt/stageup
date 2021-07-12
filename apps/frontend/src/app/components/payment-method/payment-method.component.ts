import { SelectionModel } from '@angular/cdk/collections';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatTabGroup } from '@angular/material/tabs';
import {
  DtoCreatePaymentIntent,
  IHostPrivate,
  IPaymentIntentClientSecret,
  IPaymentMethodStub,
  PurchaseableType
} from '@core/interfaces';
import { cachize, createICacheable, ICacheable } from '@frontend/app.interfaces';
import { MyselfService } from '@frontend/services/myself.service';
import { ToastService } from '@frontend/services/toast.service';
import { ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';
import { PaymentIntent, StripeError } from '@stripe/stripe-js';
import { environment } from 'apps/frontend/src/environments/environment';
import { StripeFactoryService } from 'ngx-stripe';

@Component({
  selector: 'app-payment-method',
  templateUrl: './payment-method.component.html',
  styleUrls: ['./payment-method.component.scss']
})
export class PaymentMethodComponent implements OnInit {
  @Input() isSelecting: boolean = false;
  @Input() isEditing: boolean = false;
  @Input() smaller: boolean = false;
  @Output() onSelectedMethod: EventEmitter<IPaymentMethodStub> = new EventEmitter();
  @Output() onPaymentFailure: EventEmitter<StripeError> = new EventEmitter();
  @Output() onPaymentSuccess: EventEmitter<PaymentIntent> = new EventEmitter();

  @ViewChild(MatTabGroup) tabs: MatTabGroup;
  paymentMethods: ICacheable<IPaymentMethodStub[]> = createICacheable([]);
  selectionModel: SelectionModel<IPaymentMethodStub>;

  loading: boolean = false;
  paymentIntent: ICacheable<IPaymentIntentClientSecret> = createICacheable();
  selectionListExpanded: boolean = false;

  constructor(
    private myselfService: MyselfService,
    private toastService: ToastService,
    private stripeFactory: StripeFactoryService
  ) {}

  async ngOnInit() {
    // Create SelectionModel before blocky request to allow parents to subscribe to changes
    if (this.isSelecting) this.selectionModel = new SelectionModel(false);

    await cachize(this.myselfService.readPaymentMethods(), this.paymentMethods, methods => {
      // Sort cards so default is on top
      return methods.sort(pm => (pm.is_primary ? -1 : 1));
    });

    if (this.isSelecting) {
      if (this.paymentMethods.data.length) {
        // Select the default card, or the first card if none are the default
        let primaryMethod = this.paymentMethods.data.find(pm => pm.is_primary) || this.paymentMethods.data[0];

        this.selectionModel.select(primaryMethod);
        this.onSelectedMethod.emit(primaryMethod);
      }

      this.selectionModel.changed.subscribe(v => {
        const selected = v.added[0];

        this.paymentMethods.data.sort(pm => (pm._id == selected._id ? -1 : 1));
        this.selectionListExpanded = false;

        this.onSelectedMethod.emit(selected);
      });
    }
  }

  /**
   * @description Finishes the transaction using the logged in users entered CC details
   * @param paymentIntentFn Method that generates a PaymentIntent on the PaymentMethod
   * @param paymentIntentData Data to supply to the paymentIntentFn
   */
  public async confirmPayment<T extends PurchaseableType>(
    paymentIntentFn: (data: DtoCreatePaymentIntent<T>) => Promise<IPaymentIntentClientSecret>,
    paymentIntentData: DtoCreatePaymentIntent<T>,
    stripeAccountId: IHostPrivate['stripe_account_id']
  ) {
    this.loading = true;
    // Make a request to create the PaymentIntent
    const intent = await cachize(paymentIntentFn(paymentIntentData), this.paymentIntent);

    // PaymentIntent is on the hosts Stripe Account
    const stripe = this.stripeFactory.create(environment.stripe_public_key, {
      stripeAccount: stripeAccountId
    });

    // Finally confirm the purchase
    return stripe
      .confirmCardPayment(this.paymentIntent.data.client_secret, {
        // The card used when creating the payment intent
        payment_method: intent.stripe_method_id
      })
      .toPromise()
      .then(d => {
        if (d.error) this.onPaymentFailure.emit(d.error);
        if (d.paymentIntent) this.onPaymentSuccess.emit(d.paymentIntent);
        return d;
      })
      .finally(() => (this.loading = false));
  }

  openCreateNewCardMenu() {
    this.tabs.selectedIndex = 1;
  }

  addMethodToList(event: IPaymentMethodStub) {
    this.paymentMethods.data.push(event);
    this.tabs.selectedIndex = 0;
    this.toastService.emit($localize`Added card!`, ThemeKind.Accent);

    // Select the card if the user just added it
    if (this.isSelecting) this.selectionModel.select(event);
  }

  removeMethodFromList(event: IPaymentMethodStub) {
    this.paymentMethods.data.splice(
      this.paymentMethods.data.findIndex(pm => pm._id == event._id),
      1
    );
  }
}
