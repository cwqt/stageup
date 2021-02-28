import { CurrencyCode } from '../common/currency.interface';
import { IAccessToken } from './access-token.interface';
import { IPerformanceStub } from './performance.interface';

// A record of purchase by the user
export interface IPerformancePurchase {
  _id: string;
  payment_id: number; // reference to stripe or something
  price: number;
  currency: CurrencyCode;
  performance: IPerformanceStub;
  purchased_at: number;
}
