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
  city: string;
  iso_country_code: string;
  postcode: string;
  street_name: string;
  street_number: string;
  state?: string; //US-based
  zip_code?: string; //US-based
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
