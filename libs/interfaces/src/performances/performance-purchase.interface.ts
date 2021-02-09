import { CurrencyCode } from '../common/currency.interface';
import { IPerformanceStub } from './performance.interface';

export interface IPerformancePurchase {
  _id: string;
  payment_id: number; // reference to stripe or something
  expiry: number; // unix timestamp
  key_id: string; // Signing Key ID
  token: string; // the token itself to watch said video
  price: number;
  currency: CurrencyCode;
  performance: IPerformanceStub;
  purchased_at: number;
}
