import { ISOCountryCode } from '../common/currency.interface';

export interface IAddress {
  _id: string;
  city: string;
  iso_country_code: string; //iso31661Alpha3
  postcode: string; // locale GB
  street_name: string;
  street_number: number;
}

// https://stripe.com/docs/api/payment_methods/retrieve
export interface IBillingAddress {
  city: string;
  country: ISOCountryCode;
  line1: string;
  line2?: string;
  postal_code: string;
  state?: string;
}
