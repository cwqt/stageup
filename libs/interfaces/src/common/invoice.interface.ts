import { IPerformanceStub } from '../performances/performance.interface';
import { ITicketStub } from '../performances/ticket.interface';
import { IUserStub } from '../users/user.interface';
import { CurrencyCode } from './currency.interface';
import { NUUID } from './fp.interface';

export enum PurchaseableEntity {
  Ticket = 'ticket',
  PatronTier = 'patron-tier'
}

export type PurchaseableData = {
  [PurchaseableEntity.Ticket]: ITicketStub;
};

export enum RefundReason  {
  Covid = 'covid19',
  CancelledPostponed = 'cancelled_postponed',
  Duplicate = 'duplicate',
  CannotAttend = 'cannot_attend',
  Dissatisfied = 'dissatisfied',
  WrongTicket = 'wrong_ticket',
  Other = 'other_specify'
}
export interface IRefundRequest {
  invoice_id: IInvoice["_id"];
  reason: RefundReason;
  reason_detail: string;
}

// A record of purchase by the user
export interface IInvoice {
  _id: NUUID;
  type: PurchaseableEntity;
  stripe_charge_id: string; // 'ch_xxxx...'
  stripe_receipt_url: string;
  purchased_at: number;
  amount: number; // in pennies
  currency: CurrencyCode;
  status: PaymentStatus;
}

// https://stripe.com/docs/api/orders/list#list_orders-status
export enum PaymentStatus {
  Created = 'created',
  Paid = 'paid',
  Fufilled = 'fufilled',
  Refunded = 'refunded',
  RefundDenied = 'refund_denied',
  RefundPending = 'refund_pending'
}

// Pertains to both hosts & users, should be tied into a Purchaseable supertype
// when we add patreonage etc.
export interface DtoInvoice {
  invoice_id: IInvoice['_id'];
  invoice_date: number;
  status: PaymentStatus;
  amount: number;
  currency: CurrencyCode;
}

export interface IPaymentSourceDetails {
  last_4_digits: string;
  card_type: string;
}

// Hosts ----------------------------------------------------
export interface IHostInvoiceStub extends DtoInvoice {
  performance: IPerformanceStub;
  ticket: ITicketStub;
  net_amount: number; // for hosts only
}

export interface IHostInvoice extends IHostInvoiceStub, IPaymentSourceDetails {
  receipt_url: string;
  user: IUserStub;
}

// Users ----------------------------------------------------
export interface IUserInvoiceStub extends DtoInvoice {
  performance: IPerformanceStub;
  ticket: ITicketStub;
}

export interface IUserInvoice extends IUserInvoiceStub, IPaymentSourceDetails {
  receipt_url: string;
}
