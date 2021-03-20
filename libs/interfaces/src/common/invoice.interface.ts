import { CurrencyCode } from "./currency.interface";

// A record of purchase by the user
export interface IInvoice {
  _id: string;
  stripe_charge_id: string; // 'ch_xxxx...'
  stripe_receipt_url: string;
  purchased_at: number;
  amount: number; // in pennies
  currency: CurrencyCode;
}
