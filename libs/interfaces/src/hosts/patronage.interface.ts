import { CurrencyCode } from '../common/currency.interface';
import { NUUID } from '../common/fp.interface';

export interface IPatronTier {
  _id: NUUID;
  name: string;
  created_at: number;
  cover_image: string;
  currency: CurrencyCode;
  amount: number;
  description: Array<any>; // ngx-quill items
}

export interface IHostPatronTier extends IPatronTier {
  version: number;
  total_patrons: number;
  is_visible: boolean;
  stripe_price_id: string;
  stripe_product_id: string;
}

export type DtoCreatePatronTier = Required<Pick<IPatronTier, 'name' | 'description' | 'currency' | 'amount'>>;

export interface IPatronSubscription {
  _id: NUUID;
  created_at: number;
  last_renewed: number;
  renewal_count: number;
  patron_tier: IPatronTier;
  stripe_subscription_id: string;
}
