import { IAddress } from './address.interface';

export type IPerson = IPersonInfo & IContactInfo;

export interface IPersonInfo {
  title: PersonTitle;
  first_name: string;
  last_name: string;
}

export interface IContactInfo {
  // e.614 numbers
  mobile_number: string;
  landline_number: string;
  addresses: IAddress[];
}

export enum PersonTitle {
  Mr = 'mr',
  Mrs = 'mrs',
  Ms = 'ms',
  Miss = 'miss',
  Master = 'master',
  Dr = 'dr',
  Professor = 'professor'
}
