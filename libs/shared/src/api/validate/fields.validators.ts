import { CurrencyCode, Genre, GenreMap, NUUID, CountryCode, PersonTitle, BusinessType } from '@core/interfaces';
import { enumToValues, regexes } from '@core/helpers';
import validator from 'validator';
import {
  array,
  coerce,
  create,
  define,
  enums,
  instance,
  is,
  map,
  number,
  pattern,
  refine,
  size,
  string,
  Struct,
  StructError
} from 'superstruct';
import { parsePhoneNumberFromString, PhoneNumber } from 'libphonenumber-js';

const FORBIDDEN_USERNAMES: string[] = ['fuck', 'shit', 'crap'];
const CURRENCY_CODES = enumToValues(CurrencyCode);
const BUSINESS_TYPE = enumToValues(BusinessType);

type Phone = `+${number}`;

const message = <T>(struct: Struct<T, any>, message: string): Struct<T, any> =>
  define('message', value => (is(value, struct) ? true : message));

export namespace fields {
  export const nuuid = size(string(), 11, 11);
  export const forbidden = refine(
    string(),
    'forbidden',
    value => !validator.isIn(value, FORBIDDEN_USERNAMES) || '@@validation.not_allowed'
  );
  export const phone = define<Phone>('phone', value => {
    return (
      parsePhoneNumberFromString(value as string)?.formatInternational() == (value as string) ||
      '@@validation.invalid_phone_number'
    );
  });
  export const username = pattern(size(forbidden, 6, 32), /^[a-zA-Z\d]*$/);
  export const email = refine(string(), 'email', value => validator.isEmail(value) || '@@validation.invalid_email');
  export const password = refine(string(), 'password', value => value.length > 6 || '@@validation.too_short');
  export const timestamp = refine(number(), 'timestamp', value => Math.ceil(Math.log(value + 1) / Math.LN10) == 10);
  export const name = message(size(string(), 6, 32), '@@validation.too_short');
  export const bio = refine(string(), 'bio', value => size(string(), 0, 512).is(value) || '@@validation.too_long');
  export const hmrcCompanyNumber = refine(
    number(),
    'hmrc_company_number',
    // 8 CHARACTERS, not == 8 in VALUE
    value => size(string(), 8, 8).is(value.toString()) || '@@validation.not_hmrc_number'
  );
  export const businessType = enums<BusinessType>(BUSINESS_TYPE as BusinessType[]);
  export const vatNumber = refine(
    string(),
    'vat_number',
    value => pattern(string(), regexes.vat).is(value) || '@@validation.invalid_vat_number'
  );
  export const postcode = define<string>('postcode', value => validator.isPostalCode(value as string, 'GB'));
  export const country = define<CountryCode>('iso3166', value => validator.isISO31661Alpha2(value as string));
  export const currency = enums<CurrencyCode>(CURRENCY_CODES as CurrencyCode[]);
  export const richtext = string();
  export const genre = enums(enumToValues(Genre) as Genre[]);
  export const personTitle = enums<PersonTitle>(enumToValues(PersonTitle));
  export const url = refine(string(), 'url', value => validator.isURL(value) || '@@validation.invalid_url');
}
