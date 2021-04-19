import { CurrencyCode } from '../common/currency.interface';
import { NUUID } from '../common/fp.interface';

export interface IPatronTier {
  _id: NUUID;
  name: string;
  created_at: number;
  cover_image: string;
  currency: CurrencyCode;
  amount: number;
  description: Array<any>;// ngx-quill items
}

export interface IHostPatronTier extends IPatronTier {
  version: number;
  total_patrons: number;
  is_visible: boolean;
}

export type DtoCreatePatreonTier = Required<Pick<IPatronTier, 'name' | 'description' | 'currency' | 'amount'>>;
