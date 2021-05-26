import { CountryCode } from '../common/currency.interface';
import { Idless } from '../common/fp.interface';

// https://stripe.com/docs/api/payment_methods/retrieve
export interface IAddress {
  _id: string;
  city: string;
  country: CountryCode; // iso-3166-alpha3
  line1: string;
  line2?: string;
  postal_code: string;
  state?: string;
}

export type IBillingAddress = Idless<IAddress>;
