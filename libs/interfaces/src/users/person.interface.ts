import { IAddress } from "./address.interface";

export type IPerson = IPersonInfo & IContactInfo;

export interface IPersonInfo {
  title: PersonTitle;
  first_name: string;
  last_name: string;
}

export interface IContactInfo {
  // https://www.itu.int/rec/T-REC-E.123/en for numbers
  mobile_number: number;
  landline_number: number;
  addresses: IAddress[];
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
