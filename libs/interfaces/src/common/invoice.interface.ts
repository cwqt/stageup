// A record of purchase by the user
export interface IInvoice {
  _id: string;
  payment_reference: number; // reference to stripe or something
  purchased_at: number;
}
