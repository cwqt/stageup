import { NUUID } from '../common/fp.interface';
import { PurchaseableEntity } from '../common/invoice.interface';
import { IHostPrivate } from '../hosts/host.interface';

export interface IPaymentIntentClientSecret {
  client_secret: string;
}

export interface IPaymentConfirmation {
  purchase_successful: boolean;
}

export enum StripeHook {
  PaymentIntentCreated = "payment_intent.created",
  PaymentIntentSucceded = "payment_intent.succeeded",
  ChargeSucceded = "charge.succeeded"
}

export interface IStripeChargePassthrough {
  purchaseable_type: PurchaseableEntity;
  purchaseable_id: NUUID;
  user_id: string;
  [index:string]: string
}