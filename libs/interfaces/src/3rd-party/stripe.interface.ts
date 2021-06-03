import { NUUID } from '../common/fp.interface';
import { PurchaseableType } from '../common/invoice.interface';
import { IHostPrivate } from '../hosts/host.interface';
import { DonoPeg } from '../performances/ticket.interface';
import { IPaymentMethod, IPaymentMethodStub } from '../users/payment-method.interface';

export interface DtoCreatePaymentIntent<T extends PurchaseableType> {
  payment_method_id: IPaymentMethodStub['_id'];
  purchaseable_type: T;
  purchaseable_id: NUUID;
  options: PurchaseablePaymentIntentOptions[T];
}

type PurchaseablePaymentIntentOptions = {
  [PurchaseableType.Ticket]: {
    selected_dono_peg: DonoPeg;
    allow_any_amount: number;
  };
  [PurchaseableType.PatronTier]: {};
};

export interface IPaymentIntentClientSecret {
  client_secret: string;
  stripe_method_id: string;
}

export interface IPaymentConfirmation {
  purchase_successful: boolean;
}

export enum StripeHook {
  PaymentIntentCreated = 'payment_intent.created',
  PaymentIntentSucceded = 'payment_intent.succeeded',
  InvoicePaymentSucceeded = 'invoice.payment_succeeded',
  SubscriptionDeleted = 'customer.subscription.deleted'
}

export interface IStripeChargePassthrough {
  payment_method_id: NUUID;
  purchaseable_type: PurchaseableType;
  purchaseable_id: NUUID;
  user_id: string;
  [index: string]: string;
}
