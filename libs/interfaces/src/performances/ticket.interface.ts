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
  amount: number; // int, price in pennies
  currency: CurrencyCode;
  quantity: number;
  quantity_remaining: number;
  type: TicketType;
  is_visible: boolean;
  hide_ticket_quantity: boolean;
}

export interface ITicket extends ITicketStub {
  fees: TicketFees;
  version: number;
  start_datetime: number;
  end_datetime: number;
}

export type DtoCreateTicket = Required<
  Pick<
    ITicket,
    | 'currency'
    | 'amount'
    | 'name'
    | 'type'
    | 'quantity'
    | 'fees'
    | 'start_datetime'
    | 'end_datetime'
    | 'is_visible'
    | 'hide_ticket_quantity'
  >
>;
