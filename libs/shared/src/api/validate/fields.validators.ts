import { CurrencyCode, Genre, GenreMap, NUUID, ISOCountryCode } from '@core/interfaces';
import { enumToValues } from '@core/helpers';
import validator from 'validator';
import { array, define, enums, number, pattern, refine, size, string } from 'superstruct';

const FORBIDDEN_USERNAMES: string[] = ['fuck', 'shit', 'crap'];
const CURRENCY_CODES = enumToValues(CurrencyCode);

export namespace fields {
  export const nuuid = size(string(), 11, 11);
  export const forbidden = refine(
    string(),
    'forbidden',
    value => !validator.isIn(value, FORBIDDEN_USERNAMES) || '@@validation.not_allowed'
  );
  export const email = refine(string(), 'email', value => validator.isEmail(value) || '@@validation.not_valid_email');
  export const password = refine(string(), 'password', value => value.length > 6 || '@@validation.too_short');
  export const timestamp = refine(number(), 'timestamp', value => Math.ceil(Math.log(value + 1) / Math.LN10) == 10);
  export const name = size(string(), 6, 32);
  export const username = pattern(size(forbidden, 6, 32), /^[a-zA-Z\d]*$/);
  export const bio = size(string(), 0, 512);
  export const postcode = define<string>('postcode', value => validator.isPostalCode(value as string, 'GB'));
  export const iso3166 = define<ISOCountryCode>('iso3166', value => validator.isISO31661Alpha2(value as string));
  export const currency = enums<CurrencyCode>(CURRENCY_CODES as CurrencyCode[]);
  export const richtext = array();
  export const genre = enums(enumToValues(Genre) as Genre[]);
}
