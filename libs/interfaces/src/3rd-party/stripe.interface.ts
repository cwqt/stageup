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