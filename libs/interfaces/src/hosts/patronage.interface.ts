import { CurrencyCode } from '../common/currency.interface';
import { NUUID } from '../common/fp.interface';
import { DtoInvoice, IInvoice } from '../common/invoice.interface';
import { RichText } from '../performances/performance.interface';
import { IUserStub } from '../users/user.interface';

export interface IPatronTier {
  _id: NUUID;
  name: string;
  created_at: number;
  cover_image: string;
  currency: CurrencyCode;
  amount: number;
  description: RichText; // ngx-quill items
}

export interface IHostPatronTier extends IPatronTier {
  version: number;
  total_patrons: number;
  is_visible: boolean;
  stripe_price_id: string;
  stripe_product_id: string;
}

export type DtoCreatePatronTier = Required<Pick<IPatronTier, 'name' | 'description' | 'currency' | 'amount'>>;
export type DtoUpdatePatronTier = Required<Pick<IHostPatronTier, 'name' | 'amount' | 'is_visible' | 'description'>>;

// A tracking of a users subscription to a patron tier
// Logs of renewals tracked through Invoices
export interface IPatronSubscription {
  _id: NUUID;
  created_at: number;
  last_renewal_date: number;
  next_renewal_date: number;
  renewal_count: number;
  patron_tier: IPatronTier;
  stripe_subscription_id: string;
  status: PatronSubscriptionStatus;
}

export enum PatronSubscriptionStatus {
  Active = 'active',
  Cancelled = 'cancelled'
}

export interface DtoPatronageSubscription {
  subscription: IPatronSubscription;
  last_invoice: DtoInvoice;
}

export type DtoUserPatronageSubscription = DtoPatronageSubscription;
export type DtoHostPatronageSubscription = DtoPatronageSubscription & { user: IUserStub };
