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

// Enum to make single definition, and also allows for further commission rates to be added in the future
export enum CommissionRate {
  Platform = 0.1
}

// UK VAT rate is 20%
export const VATRate = 0.2;

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
