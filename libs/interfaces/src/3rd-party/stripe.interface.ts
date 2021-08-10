import { NUUID, Primitive } from '../common/fp.interface';
import { PurchaseableType } from '../finance/invoice.interface';
import { DonoPeg } from '../performances/ticket.interface';
import { IPaymentMethodStub } from '../finance/payment-method.interface';

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
    hard_host_marketing_opt_out: boolean;
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
  ChargeRefunded = 'charge.refunded',
  InvoicePaymentSucceeded = 'invoice.payment_succeeded',
  SubscriptionDeleted = 'customer.subscription.deleted'
}

// enum to value string union
export type HandledStripeHooks = `${StripeHook}`;

export interface IStripeChargePassthrough {
  payment_method_id: NUUID;
  purchaseable_type: PurchaseableType;
  purchaseable_id: NUUID;
  user_id: string;

  // metadata is always a dictionary of string key and string value.
  // https://stackoverflow.com/a/59429263
  [index: string]: string;
}
