import { IPerformanceStub } from "../performances/performance.interface";
import { ITicketStub } from "../performances/ticket.interface";
import { CurrencyCode } from "./currency.interface";

export enum PurchaseableEntity {
  Ticket = 'ticket'
}

// A record of purchase by the user
export interface IInvoice {
  _id: string;
  stripe_charge_id: string; // 'ch_xxxx...'
  stripe_receipt_url: string;
  purchased_at: number;
  amount: number; // in pennies
  currency: CurrencyCode;
  status: PaymentStatus;
}

// https://stripe.com/docs/api/orders/list#list_orders-status
export enum PaymentStatus {
	Created = "created",
	Paid = "paid",
	Fufilled = "fufilled",
	Refunded = "refunded",
	RefundDenied = "refund_denied",
  RefundPending = "refund_pending"
}

// Pertains to both hosts & users, should be tied into a Purchaseable supertype
// when we add patreonage etc.
export interface DtoInvoice {
  invoice_id: IInvoice["_id"];
  invoice_date: number;
  status: PaymentStatus;
  amount: number;
  currency: CurrencyCode;
}

export interface IHostInvoice extends DtoInvoice {
	performance: IPerformanceStub;
	ticket: ITicketStub;
	net_amount: number; // for hosts only
}

export interface IUserInvoice extends DtoInvoice {
	performance: IPerformanceStub;
	ticket: ITicketStub;
  receipt_url: string;
}