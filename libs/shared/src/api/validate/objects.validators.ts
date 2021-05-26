import { enumToValues } from '@core/helpers';
import {
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
  IHostMemberChangeRequest,
  PaginationOptions,
  PurchaseableEntityType,
  TicketFees,
  TicketType
} from '@core/interfaces';
import {
  array,
  boolean,
  Describe,
  enums,
  integer,
  nullable,
  number,
  object,
  optional,
  size,
  string
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
    bio: fields.bio,
    name: fields.name
  });

  export const DtoResetPassword: Describe<DtoResetPassword> = object({
    new_password: fields.password,
    old_password: fields.password
  });

  export const DtoCreatePerformance: Describe<DtoCreatePerformance> = object({
    name: size(string(), 8, 64),
    premiere_date: optional(fields.timestamp),
    description: fields.richtext,
    genre: fields.genre
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
    description: fields.richtext
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
    dono_pegs: nullable(
      array(
        enums<DonoPeg>(['lowest', 'low', 'medium', 'high', 'highest', 'allow_any'])
      )
    )
  });

  export const IAddress: Describe<Idless<IAddress>> = object({
    city: string(),
    iso_country_code: fields.iso3166,
    postcode: fields.postcode,
    street_name: string(),
    street_number: number()
  });

  // export const IAddress = (): ObjectValidator<Idless<IAddress>> => {
  //   return {
  //     city: v => FV.isString(v, "@@error.invalid"),
  //     iso_country_code: v => FV.ISOCountry(v),
  //     postcode: v => FV.postcode(v),
  //     street_name: v => FV.isString(v, "@@error.invalid"),
  //     street_number: v => FV.isInt(v, "@@error.invalid")
  //   };
  // };

  // export const IPersonInfo = (): ObjectValidator<IPersonInfo> => {
  //   return {
  //     title: v => FV.isString(v).isIn(Object.values(PersonTitle)),
  //     first_name: v => FV.isString(v),
  //     last_name: v => FV.isString(v)
  //   };
  // };

  // export const IPerson = (): ObjectValidator<Idless<IPerson>> => {
  //   return {
  //     ...IPersonInfo(),
  //     mobile_number: v => v.isMobilePhone('en-GB'),
  //     landline_number: v => v.isMobilePhone('en-GB'),
  //     addresses: v => v.custom(array(IAddress()))
  //   };
  // };

  // export const ISocialInfo = (): ObjectValidator<ISocialInfo> => {
  //   return {
  //     site_url: v => v.optional({ nullable: true, checkFalsy: true }).isURL().withMessage(ErrCode.NOT_URL),
  //     linkedin_url: v =>
  //       v
  //         .optional({ nullable: true, checkFalsy: true })
  //         .isURL({ host_whitelist: ['linkedin.com'] })
  //         .withMessage(ErrCode.NOT_URL),
  //     facebook_url: v =>
  //       v
  //         .optional({ nullable: true, checkFalsy: true })
  //         .isURL({ host_whitelist: ['facebook.com'] })
  //         .withMessage(ErrCode.NOT_URL),
  //     instagram_url: v =>
  //       v
  //         .optional({ nullable: true, checkFalsy: true })
  //         .isURL({ host_whitelist: ['instagram.com'] })
  //         .withMessage(ErrCode.NOT_URL)
  //   };
  // };

  // export const DtoCreateTicket = (): ObjectValidator<DtoCreateTicket> => {
  //   return {
  //     name: v => FV.isString(v),
  //     amount: v => FV.isInt(v),
  //     currency: v => FV.CurrencyCode(v),
  //     type: v => v.isIn(enumToValues(TicketType)),
  //     quantity: v => v.isInt(),
  //     fees: v => v.isIn(enumToValues(TicketFees)),
  //     start_datetime: v => FV.timestamp(v),
  //     end_datetime: v => FV.timestamp(v),
  //     is_visible: v => v.isBoolean(),
  //     is_quantity_visible: v => v.isBoolean(),
  //     dono_pegs: v => v.optional({ nullable: true }).isArray()
  //     // FIXME: array validator doesn't support primitive arrays
  //     // .custom(
  //     //   array({
  //     //     '*': v => v.isIn(['lowest', 'low', 'medium', 'high', 'highest', 'allow_any'])
  //     //   })
  //     // )
  //   };
  // };

  export const DtoCreatePaymentIntent: Describe<DtoCreatePaymentIntent> = object({
    payment_method_id: fields.nuuid,
    purchaseable_type: enums(enumToValues(PurchaseableEntityType) as PurchaseableEntityType[]),
    purchaseable_id: fields.nuuid,
    options: optional(
      object({
        selected_dono_peg: enums<DonoPeg>(['lowest', 'low', 'medium', 'high', 'highest', 'allow_any']),
        allow_any_amount: number()
      })
    )
  });

  export const IHostMemberChangeRequest: Describe<IHostMemberChangeRequest> = object({
    value: nullable(string())
  });

  export const PaginationOptions = (pageLimit: number = 50): Describe<PaginationOptions> =>
    object({
      per_page: size(integer(), 1, pageLimit),
      page: integer()
    });
}
