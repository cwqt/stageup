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
}

// https://stripe.com/docs/api/orders/list#list_orders-status
export enum PaymentStatus {
	Created = "created",
	Paid = "paid",
	Fufilled = "fufilled",
	Refunded = "refunded",
	RefundDenied = "refund_denied"
}

export interface IHostInvoice {
	invoice_id: IInvoice["_id"];
	performance: IPerformanceStub;
	ticket: ITicketStub;
	invoice_date: number;
	amount: number;
	net_amount: number;
	status: PaymentStatus
}