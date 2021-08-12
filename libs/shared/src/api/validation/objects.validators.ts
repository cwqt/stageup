import { enumToValues } from '@core/helpers';
import {
  AssetType,
  DonoPeg,
  DtoCreateHost,
  DtoCreatePatronTier,
  DtoCreatePaymentIntent,
  DtoCreatePerformance,
  DtoCreateTicket,
  DtoCreateUser,
  DtoLogin,
  DtoResetPassword,
  DtoUpdateUser,
  IAddress,
  Idless,
  IHostBusinessDetails,
  IHostMemberChangeRequest,
  IInvoice,
  IRefundRequest,
  RefundRequestReason,
  IPersonInfo,
  ISocialInfo,
  PaginationOptions,
  PurchaseableType,
  IDeleteHostReason,
  TicketFees,
  TicketType,
  DeleteHostReason,
  BusinessType,
  DtoUpdateHost,
  IContactInfo,
  DtoUpdatePatronTier,
  IBulkRefund,
  BulkRefundReason,
  IProcessRefunds,
  DonoPegs
} from '@core/interfaces';
import {
  any,
  array,
  boolean,
  coerce,
  Describe,
  enums,
  integer,
  literal,
  nullable,
  number,
  object,
  optional,
  refine,
  size,
  string,
  union
} from 'superstruct';
import { Except } from 'type-fest';
import { fields } from './fields.validators';

export namespace objects {
  export const DtoLogin: Describe<DtoLogin> = object({
    email_address: fields.email,
    password: string()
  });

  export const DtoCreateUser: Describe<DtoCreateUser> = object({
    username: fields.username,
    email_address: fields.email,
    password: fields.password
  });

  export const DtoUpdateUser: Describe<DtoUpdateUser> = object({
    email_address: fields.email,
    bio: nullable(fields.bio),
    name: nullable(fields.name)
  });

  export const DtoResetPassword: Describe<DtoResetPassword> = object({
    new_password: fields.password,
    old_password: fields.password
  });

  // export const DtoCreatePerformance: Describe<DtoCreatePerformance> = object({
  //   name: size(string(), 8, 64),
  //   publicity_period: {start: fields.timestamp, end: fields.timestamp},
  //   //publicity_period_end: fields.timestamp,
  //   //publicity_period: optional(fields.timestamp),{ start: fields.number, end: fields.number }
  //   description: optional(fields.richtext),
  //   genre: fields.genre,
  //   type: union([literal('vod'), literal('live')])
  // });

  export const DtoCreateHost: Describe<DtoCreateHost> = object({
    username: fields.username,
    name: fields.name,
    email_address: fields.email
  });

  export const DtoCreatePatronTier: Describe<DtoCreatePatronTier> = object({
    name: string(),
    currency: fields.currency,
    amount: number(),
    description: optional(fields.richtext)
  });

  export const DtoCreateTicket: Describe<DtoCreateTicket> = object({
    name: string(),
    amount: number(),
    currency: fields.currency,
    type: enums<TicketType>(enumToValues(TicketType)),
    quantity: number(),
    fees: enums<TicketFees>(enumToValues(TicketFees)),
    start_datetime: fields.timestamp,
    end_datetime: fields.timestamp,
    is_visible: boolean(),
    is_quantity_visible: boolean(),
    dono_pegs: optional(
      array(
        enums<DonoPeg>(['lowest', 'low', 'medium', 'high', 'highest', 'allow_any'])
      )
    )
  });

  export const IAddress: Describe<Required<Idless<IAddress>>> = object({
    city: string(),
    country: fields.country,
    postal_code: fields.postcode,
    line1: string(),
    line2: optional(string()),
    state: optional(string())
  });

  export const RefundInvoiceRequest: Describe<IRefundRequest> = object({
    requested_on: fields.timestamp,
    request_reason: enums<RefundRequestReason>(enumToValues(RefundRequestReason)),
    request_detail: string()
  });

  export const IBulkRefund: Describe<IBulkRefund> = object({
    bulk_refund_reason: optional(enums<BulkRefundReason>(enumToValues(BulkRefundReason))),
    bulk_refund_detail: optional(string())
  });

  export const IProcessRefunds: Describe<IProcessRefunds> = object({
    invoice_ids: array(fields.nuuid),
    bulk_refund_reason: optional(enums<BulkRefundReason>(enumToValues(BulkRefundReason))),
    bulk_refund_detail: optional(string())
  });

  export const IHostBusinessDetails: Describe<IHostBusinessDetails> = object({
    hmrc_company_number: optional(fields.hmrcCompanyNumber),
    vat_number: optional(fields.vatNumber),
    business_address: IAddress,
    business_contact_number: fields.phone,
    business_type: fields.businessType
  });

  export const IPersonInfo: Describe<IPersonInfo> = object({
    title: fields.personTitle,
    first_name: string(),
    last_name: string()
  });

  export const ISocialInfo: Describe<ISocialInfo> = object({
    site_url: optional(fields.url),
    linkedin_url: optional(fields.url),
    facebook_url: optional(fields.url),
    instagram_url: optional(fields.url),
    pinterest_url: optional(fields.url),
    youtube_url: optional(fields.url),
    twitter_url: optional(fields.url)
  });

  export const DtoCreatePaymentIntent: Describe<DtoCreatePaymentIntent<PurchaseableType>> = object({
    payment_method_id: fields.nuuid,
    purchaseable_type: enums(enumToValues(PurchaseableType) as PurchaseableType[]),
    purchaseable_id: fields.nuuid,
    options: refine(object(), 'purchaseable_options', value => {
      switch (value.purchasable_type) {
        case PurchaseableType.PatronTier:
          return object<DtoCreatePaymentIntent<PurchaseableType.PatronTier>['options']>({}).is(value);
        case PurchaseableType.Ticket: {
          type X = DtoCreatePaymentIntent<PurchaseableType.Ticket>['options'];
          // IMPORTANT X[index] --> Type 'T' does not satisfy the constraint 'ObjectSchema'.
          type T = { [index in keyof X]: any }; // not fully type-safe, but at least keeping keys

          return object<T>({
            selected_dono_peg: enums<DonoPeg>(DonoPegs),
            allow_any_amount: number(),
            hard_host_marketing_opt_out: boolean()
          }).is(value);
        }
      }
    })
  });

  export const IHostMemberChangeRequest: Describe<IHostMemberChangeRequest> = object({
    value: optional(string())
  });

  // Updated, since the received data in the request is a 'string'.
  export const PaginationOptions = (pageLimit: number = 50): Describe<PaginationOptions> =>
    object({
      per_page: refine(union([number(), string()]), 'per_page', value => {
        const num = typeof value == 'number' ? value : parseInt(value);
        return !isNaN(num) && num >= 1 && num <= pageLimit;
      }),
      page: refine(union([number(), string()]), 'page', value => {
        const num = typeof value == 'number' ? value : parseInt(value);
        return !isNaN(num);
      })
    }) as any; // cast to any because of issues with qs parsing query string parameters
  // as strings & not inferring number, should be either string | number - but the type
  // should only be numbers

  export const IDeleteHostReason: Describe<IDeleteHostReason> = object({
    reasons: array(enums<DeleteHostReason>(enumToValues(DeleteHostReason))),
    explanation: optional(string())
  });

  export const DtoUpdateHost: Describe<DtoUpdateHost> = object({
    email_address: fields.email,
    username: fields.username,
    name: fields.name,
    vat_number: fields.vatNumber,
    business_details: IHostBusinessDetails,
    social_info: ISocialInfo
  });

  export const DtoUpdatePatronTier: Describe<DtoUpdatePatronTier> = object({
    name: string(),
    description: fields.richtext,
    amount: number(),
    is_visible: boolean()
  });
}
