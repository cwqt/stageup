import { IHostPrivate } from '../hosts/host.interface';

export interface IPaymentIntentClientSecret {
  client_secret: string;
  stripe_account_id: IHostPrivate["stripe_account_id"];
}

export interface IPaymentConfirmation {
  purchase_successful: boolean;
}

export enum StripeHook {
  PaymentIntentCreated = "payment_intent.created",
  PaymentIntentSucceded = "payment_intent.succeeded",
  ChargeSucceded = "charge.succeeded"
}