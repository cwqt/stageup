import { uuid } from '@core/helpers';
import {
  IRefund,
  IRefundRequest,
  RefundResponseReason,
  RefundRequestReason,
  BulkRefundReason,
  IBulkRefund
} from '@core/interfaces';
import { BaseEntity, Entity, Column, ManyToOne, BeforeInsert, PrimaryColumn, OneToOne } from 'typeorm';
import { Invoice } from './invoice.entity';

@Entity()
export class Refund extends BaseEntity implements IRefund {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() {
    this._id = uuid();
  }

  @Column() is_refunded: boolean;

  // Request
  @Column({ nullable: true }) requested_on: number;
  @Column('enum', { enum: RefundRequestReason, nullable: true }) request_reason: RefundRequestReason;
  @Column({ nullable: true }) request_detail: string;

  // Response
  @Column({ nullable: true }) responded_on?: number;
  @Column('enum', { enum: RefundResponseReason, nullable: true }) response_reason?: RefundResponseReason;
  @Column({ nullable: true }) response_detail?: string;

  // Bulk Refunds
  @Column('enum', { enum: BulkRefundReason, nullable: true }) bulk_refund_reason?: BulkRefundReason;
  @Column({ nullable: true }) bulk_refund_detail?: string;

  @ManyToOne(() => Invoice, invoice => invoice.refunds, { cascade: true, nullable: false }) invoice: Invoice;

  constructor(invoice: Invoice, request?: IRefundRequest, bulkRefund?: IBulkRefund) {
    super();
    this.invoice = invoice;

    if (request) {
      this.requested_on = request.requested_on;
      this.request_detail = request.request_detail;
      this.request_reason = request.request_reason;
    }

    if (bulkRefund) {
      this.bulk_refund_reason = bulkRefund.bulk_refund_reason;
      this.bulk_refund_detail = bulkRefund.bulk_refund_detail;
    }

    this.is_refunded = false;
  }

  toFull(): Required<IRefund> {
    return {
      _id: this._id,
      requested_on: this.requested_on,
      request_detail: this.request_detail,
      request_reason: this.request_reason,
      is_refunded: this.is_refunded,
      responded_on: this.responded_on,
      response_reason: this.response_reason,
      response_detail: this.response_detail,
      bulk_refund_reason: this.bulk_refund_reason,
      bulk_refund_detail: this.bulk_refund_detail
    };
  }
}
