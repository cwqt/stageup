import { NUUID } from '../common/fp.interface';

export enum RefundRequestReason {
  Covid = 'covid19',
  CancelledPostponed = 'cancelled_postponed',
  Duplicate = 'duplicate',
  CannotAttend = 'cannot_attend',
  Dissatisfied = 'dissatisfied',
  WrongTicket = 'wrong_ticket',
  Other = 'other_specify'
}

export enum BulkRefundReason {
  DateMoved = 'rescheduled_postponed',
  Cancelled = 'cancelled',
  Overcharged = 'buyer_overcharged',
  PerformanceDeletedAutoRefund = 'performance_deleted_auto_refund'
}

export enum RefundResponseReason {
  Accepted = 'accepted',
  OutsidePolicy = 'outside_refund_policy'
}

export interface IRefundRequest {
  requested_on: number;
  request_reason: RefundRequestReason;
  request_detail: string;
}

export interface IBulkRefund {
  bulk_refund_reason: BulkRefundReason;
  bulk_refund_detail: string;
}

export interface IProcessRefunds extends IBulkRefund {
  invoice_ids: string[];
}

export interface IRefundResponse {
  responded_on: number;
  response_reason: RefundResponseReason;
  response_detail: string;
}

export interface IRefund extends IRefundRequest, Partial<IRefundResponse>, Partial<IBulkRefund> {
  _id: NUUID;
  is_refunded: boolean;
}
