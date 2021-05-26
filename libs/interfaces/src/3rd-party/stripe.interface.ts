import { NUUID } from '../common/fp.interface';
import { PurchaseableEntityType } from '../common/invoice.interface';
import { IHostPrivate } from '../hosts/host.interface';
import { DonoPeg } from '../performances/ticket.interface';
import { IPaymentMethod, IPaymentMethodStub } from '../users/payment-method.interface';

export interface DtoCreatePaymentIntent {
  payment_method_id: IPaymentMethodStub['_id'];
  purchaseable_type: PurchaseableEntityType;
  purchaseable_id: NUUID;

  // TODO: better typing on this...for tickets only
  options?: {
    selected_dono_peg: DonoPeg;
    allow_any_amount: number;
  };
}

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
  ChargeSucceded = 'charge.succeeded',
  InvoicePaymentSucceeded = 'invoice.payment_succeeded'
}

export interface IStripeChargePassthrough {
  payment_method_id: NUUID;
  purchaseable_type: PurchaseableEntityType;
  purchaseable_id: NUUID;
  user_id: string;
  [index: string]: string;
}
