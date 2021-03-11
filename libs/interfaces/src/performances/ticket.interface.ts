import { CurrencyCode } from '../common/currency.interface';

export enum TicketType {
  Paid = 'paid',
  Free = 'free',
  Donation = 'dono'
}

export enum TicketFees {
  PassOntoPurchaser = 'pass_onto_purchaser',
  Absorb = 'absorb'
}

export interface ITicketStub {
  _id: string;
  name: string;
  price: number;
  currency: CurrencyCode;
  quantity: number;
  type: TicketType;
}

export interface ITicket extends ITicketStub {
  fees: TicketFees;
  version: number;
  is_visible: boolean;
  start_datetime: number;
  end_datetime: number;
}

export type DtoCreateTicket = Required<
  Pick<
    ITicket,
    | 'currency'
    | 'price'
    | 'name'
    | 'type'
    | 'quantity'
    | 'fees'
    | 'start_datetime'
    | 'end_datetime'
    | 'is_visible'
  >
>;
