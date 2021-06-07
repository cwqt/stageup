import {
  BASE_AMOUNT_MAP,
  CardBrand,
  CurrencyCode,
  DonoPeg,
  DONO_PEG_WEIGHT_MAPPING,
  Environment,
  FilterQuery,
  ILocale,
  NUUID,
  ParsedRichText,
  Primitive,
  RefundReason,
  RichText
} from '@core/interfaces';
import locale from 'express-locale';
import { nanoid } from 'nanoid';
import QueryString from 'qs';

/**
 * @description Returns the UNIX timestamp of date in seconds
 * @param date
 */
export const timestamp = (date?: Date): number => Math.floor((date || new Date()).getTime() / 1000);

/**
 * @description Delay async execution for a duration
 * @param duration time in milli-seconds
 */
export const timeout = (duration: number = 1000) => new Promise(resolve => setTimeout(resolve, duration));

/**
 * @description Generate a unique identifier which is as long as a YouTube ID
 */
export const uuid = () => nanoid(11) as NUUID;

/**
 * @description Join kv's and uri escape
 */
export const stitchParameters = (input: { [index: string]: Primitive }): string => {
  return Object.entries(input).reduce((accumulator, current, index) => {
    return accumulator + `${index === 0 ? '?' : '&'}${current[0]}=${current[1].toString()}`;
  }, '');
};

/**
 * @description Creates a new function using the current application environment to see if the
 * application is running in said environment or not
 */
export const isEnv = (currentEnv: Environment) => (desiredEnv: Environment | Environment[]) => {
  return Array.isArray(desiredEnv) ? desiredEnv.some(e => e === currentEnv) : desiredEnv === currentEnv;
};

/**
 * @description Turns an enum into it's value counterparts
 * @param enumme some enum
 * @param numberEnum if the enum is a number enum
 * @example
 * enum Test { hello = "world" }
 * enumToValues(Test) // ["world"]
 */
export const enumToValues = <T = string>(enumme: any, numberEnum: boolean = false): T[] => {
  return Object.keys(enumme)
    .map(key => enumme[key])
    .filter(value => typeof value === (numberEnum ? 'number' : 'string')) as T[];
};

/**
 * @description Strip time component from a date object
 */
export const timeless = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

/**
 * @description Add days onto a date
 */
export const addDay = (date: Date, amount: number): Date => {
  return timeless(new Date(new Date(date.getTime() + amount * 60 * 60 * 24 * 1000)));
};

export interface IQueryParams {
  per_page?: number;
  page?: number;
  filter?: { [index: string]: FilterQuery };
  sort?: { [index: string]: 'ASC' | 'DESC' };
  [index: string]: any;
}

/**
 * @description Construct URL query parameters for backend consumption
 * @example querize({ filter: { username: "hello", state:[1,2,3]} })
 *
 * // returns "?filter[username]=hello&filter[state]=1,2,3"
 */
export const querize = (query: IQueryParams) =>
  query
    ? QueryString.stringify(query, {
        arrayFormat: 'comma',
        addQueryPrefix: true,
        encode: false
      })
    : '';

/**
 * @description identify function, for inline object-type casting
 * @param value object to be cast as T
 * @see https://stackoverflow.com/a/38029708
 */
export function to<T>(value: T): T {
  return value;
}

/**
 * @description Calculate the ticket donation amount from the selected peg and currency
 */
export const getDonoAmount = (donoPeg: DonoPeg, currency: CurrencyCode, allowAnyQty: number = 0) => {
  return donoPeg == 'allow_any' ? allowAnyQty : DONO_PEG_WEIGHT_MAPPING[donoPeg] * BASE_AMOUNT_MAP[currency];
};

/**
 * @description Find elements that exist in both a & b
 * @param inverse Invert the search, to find elements that don't exist in a or b
 * @returns Intersected elements
 */
export function intersect<T = Primitive>(a: T[], b: T[], inverse: boolean = false): T[] {
  return a.filter(x => b.includes(x) == !inverse);
}

/**
 * @description Picks at random 1 element from an array
 * @param arr
 * @returns
 */
export const sample = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * @description Return ordinal of a date. 1'st', 2'nd', 3'rd' etc.
 * @param date
 * @returns Ordinal: st, nd, rd, th
 */
export const dateOrdinal = (date: Date, includeDay: boolean = false): string => {
  const i = date.getDay();

  const ordinal = (() => {
    let j = i % 10,
      k = i % 100;
    if (j == 1 && k != 11) {
      return i + 'st';
    }
    if (j == 2 && k != 12) {
      return i + 'nd';
    }
    if (j == 3 && k != 13) {
      return i + 'rd';
    }
    return i + 'th';
  })();

  return includeDay ? `${i}${ordinal}` : ordinal;
};

export const parseRichText = (richtext: RichText): ParsedRichText => JSON.parse(richtext);
export const stringifyRichText = (ops: any[]) => JSON.stringify({ ops: ops });
export const readRichTextContent = (text: RichText | ParsedRichText) =>
  (typeof text == 'string' ? parseRichText(text) : text).ops.reduce((acc, curr) => ((acc += curr.insert), acc), '');

export const unix = (date: number): Date => new Date(date * 1000);

export const i18n = {
  /**
   * @description Takes an amount (in smallest currency denomination) and a currency code, & returns a formatted string
   * like 1000 USD --> $10.00
   */
  money: (amount: number, currency: CurrencyCode) => {
    // FUTURE support locales other than en-GB money formatting
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: currency })
      .format(amount / 100) // amount should be stored in pennies
      .toString();
  },

  /**
   * @description Format a date nicely using Intl
   * @param date
   * @param locale ILocale or LOCALE_ID injection token
   * @returns
   */
  date: (date: Date, locale: ILocale | string): string => {
    return new Intl.DateTimeFormat(typeof locale == 'string' ? locale : `${locale.language}-${locale.region}`, {
      timeStyle: 'short',
      dateStyle: 'full'
    } as any).format(date);
  }
};

export const pipes = {
  cardBrand: (brand: CardBrand): string => {
    const pretty: { [index in CardBrand]: string } = {
      [CardBrand.Amex]: `American Express`,
      [CardBrand.Diners]: `Diners`,
      [CardBrand.Discover]: `Discover`,
      [CardBrand.JCB]: `JCB`,
      [CardBrand.Mastercard]: `Mastercard`,
      [CardBrand.UnionPay]: `UnionPay`,
      [CardBrand.Visa]: `Visa`,
      [CardBrand.Unknown]: `Unknown`
    };

    return pretty[brand];
  },
  refundReason: (reason: RefundReason): string => {
    const pretty: { [index in RefundReason]: string } = {
      [RefundReason.Covid]: 'COVID-19',
      [RefundReason.CancelledPostponed]: 'Event was cancelled/postponed',
      [RefundReason.Duplicate]: 'Duplicate ticket/purchased twice',
      [RefundReason.WrongTicket]: 'Wrong event purchased',
      [RefundReason.Dissatisfied]: 'Dissatisfied with event',
      [RefundReason.CannotAttend]: 'Unable to attend event',
      [RefundReason.Other]: 'Other, please provide details below...'
    };

    return pretty[reason];
  }
};
