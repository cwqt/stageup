export interface IAddress {
  _id: string;
  city: string;
  iso_country_code: string; //iso31661Alpha3
  postcode: string; // locale GB
  street_name: string;
  street_number: number;
}