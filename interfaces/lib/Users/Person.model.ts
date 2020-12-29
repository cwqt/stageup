export type IPerson = IPersonInfo & IContactInfo;
export interface IPersonInfo {
  title: PersonTitle;
  first_name: string;
  last_name: string;
}
export interface IContactInfo {
  mobile_number: number;
  landline_number: number;
  addresses: IAddress[];
}
export interface IAddress {
  _id: number;
  city: string;
  iso_country_code: string; //iso31661Alpha3
  postcode: string; // locale GB
  street_name: string;
  street_number: number;
}

export enum PersonTitle {
  Mr = 'mr',
  Mrs = 'mrs',
  Ms = 'ms',
  Miss = 'miss',
  Master = 'master',
  Dr = 'dr',
  Professor = 'professor',
}
