import Stripe from 'stripe';
import { NUUID } from '../common/fp.interface';

export enum CardBrand {
  Amex = `amex`,
  Diners = `diners`,
  Discover = `discover`,
  JCB = `jcb`,
  Mastercard = `mastercard`,
  UnionPay = `unionpay`,
  Visa = `visa`,
  Unknown = `unknown`
}

export interface IPaymentMethodStub {
  _id: NUUID;
  last4: string; // of cc details
  brand: CardBrand;
  created_at: number;
  last_used_at: number;
  is_primary: boolean; // default payment source
}

export interface IPaymentMethod extends IPaymentMethodStub {
  stripe_method_id: string; // e.g. pm_1EUmyr2x6R10KRrhlYS3l97f
  billing_details: Stripe.PaymentMethod.BillingDetails;
}

export interface DtoAddPaymentMethod {
  stripe_method_id: string;
  is_primary: boolean;
}
