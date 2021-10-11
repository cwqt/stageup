import { CurrencyCode } from '../common/currency.interface';

export const TICKETS_QTY_UNLIMITED: number = -1

export enum TicketType {
  Paid = 'paid',
  Free = 'free',
  Donation = 'dono'
}

// Temporarily removed, will likely be re-added in future
// export enum TicketFees {
//   PassOntoPurchaser = 'pass_onto_purchaser',
//   Absorb = 'absorb'
// }

export const DonoPegs = ['lowest', 'low', 'medium', 'high', 'highest', 'allow_any'] as const;
export type DonoPeg = typeof DonoPegs[number];

export enum DonoPegWeights {
  Lowest = 2.5,
  Low = 5.0,
  Medium = 10,
  High = 15,
  Highest = 20
}

export const DONO_PEG_WEIGHT_MAPPING: { [index in DonoPeg]: DonoPegWeights } = {
  lowest: DonoPegWeights.Lowest,
  low: DonoPegWeights.Low,
  medium: DonoPegWeights.Medium,
  high: DonoPegWeights.High,
  highest: DonoPegWeights.Highest,
  allow_any: 1
} as const;

export interface DtoDonationPurchase {
  selected_dono_peg: DonoPeg;
  allow_any_amount?: number;
}

export interface ITicketStub {
  _id: string;
  name: string;
  amount: number; // int, price in pennies
  currency: CurrencyCode;
  quantity: number;
  quantity_remaining: number;
  type: TicketType;
  dono_pegs: DonoPeg[];
  is_visible: boolean;
  is_quantity_visible: boolean;
}

export interface ITicket extends ITicketStub {
  // fees: TicketFees;
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
    // | 'fees'
    | 'start_datetime'
    | 'end_datetime'
    | 'is_visible'
    | 'dono_pegs'
    | 'is_quantity_visible'
  >
>;
