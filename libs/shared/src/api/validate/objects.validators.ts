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
  RefundReason,
  IPersonInfo,
  ISocialInfo,
  PaginationOptions,
  PurchaseableType,
  IDeleteHostReason,
  TicketFees,
  TicketType,
  DeleteHostReason,
  DtoUpdateHost,
  IContactInfo
} from '@core/interfaces';
import {
  any,
  array,
  boolean,
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

  export const DtoCreatePerformance: Describe<DtoCreatePerformance> = object({
    name: size(string(), 8, 64),
    premiere_datetime: optional(fields.timestamp),
    description: optional(fields.richtext),
    genre: fields.genre,
    type: union([literal('vod'), literal('live')])
  });

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
    request_reason: enums<RefundReason>(enumToValues(RefundReason)),
    request_detail: string()
  });

  export const IHostBusinessDetails: Describe<IHostBusinessDetails> = object({
    hmrc_company_number: fields.hmrcCompanyNumber,
    business_address: IAddress,
    business_contact_number: fields.phone,
    vat_number: fields.vatNumber
  });

  export const IPersonInfo: Describe<IPersonInfo> = object({
    title: fields.personTitle,
    first_name: string(),
    last_name: string()
  });

  export const ISocialInfo: Describe<ISocialInfo> = object({
    site_url: fields.url,
    linkedin_url: optional(fields.url),
    facebook_url: optional(fields.url),
    instagram_url: optional(fields.url)
  });

  export const DtoCreatePaymentIntent: Describe<DtoCreatePaymentIntent<PurchaseableType>> = object({
    payment_method_id: fields.nuuid,
    purchaseable_type: enums(enumToValues(PurchaseableType) as PurchaseableType[]),
    purchaseable_id: fields.nuuid,
    options: refine(object(), 'purchaseable_options', value => {
      switch (value.purchasable_type) {
        case PurchaseableType.PatronTier:
          return object<DtoCreatePaymentIntent<PurchaseableType.PatronTier>['options']>({}).is(value);
        case PurchaseableType.Ticket:
          return optional(
            object<DtoCreatePaymentIntent<PurchaseableType.PatronTier>['options']>({
              selected_dono_peg: enums<DonoPeg>(['lowest', 'low', 'medium', 'high', 'highest', 'allow_any']),
              allow_any_amount: number()
            })
          ).is(value);
      }
    })
  });

  export const IHostMemberChangeRequest: Describe<IHostMemberChangeRequest> = object({
    value: optional(string())
  });

  export const PaginationOptions = (pageLimit: number = 50): Describe<PaginationOptions> =>
    object({
      per_page: size(integer(), 1, pageLimit),
      page: integer()
    });

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
}
