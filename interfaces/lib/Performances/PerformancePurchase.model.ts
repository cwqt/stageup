import { CurrencyCode } from '../Common/Currency.types';
import { IPerformanceStub } from './Performance.model';

export interface IPerformancePurchase {
  _id: number;
  payment_id: number; // reference to stripe or something
  expiry: number; //UNIX epoch
  key_id: string; // Signing Key ID
  token: string; //the token itself to watch said video
  price: number;
  currency: CurrencyCode;
  performance: IPerformanceStub;
  date_purchased: number;
}
