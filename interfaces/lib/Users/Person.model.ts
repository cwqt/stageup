export interface IPersonInfo {
  first_name: string;
  last_name: string;
  title: PersonTitle;
  contact_info: IContactInfo;
  // billing_info?: IBillingInfo;
}

export interface IContactInfo {
  mobile_number: number;
  landline_number: number;
  addresses: IAddress[];
}

// export interface IBillingInfo {
//   first_name: string;
//   last_name: string;
//   address: IAddress;
//   stripe_id: string;
// }

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
  Mr = "mr",
  Mrs = "mrs",
  Ms = "ms",
  Miss = "miss",
  Master = "master",
  Dr = "dr",
  Professor = "professor"
}