import {
  AssetType,
  BASE_AMOUNT_MAP,
  BulkRefundReason,
  CardBrand,
  CurrencyCode,
  IDateTimeFormatOptions,
  DonoPeg,
  DONO_PEG_WEIGHT_MAPPING,
  Environment,
  FilterQuery,
  IAsset,
  IAssetStub,
  ILocale,
  NUUID,
  ParsedRichText,
  Primitive,
  RefundRequestReason,
  RichText,
} from '@core/interfaces';
import { nanoid } from 'nanoid';
import QueryString from 'qs';
import moment from 'moment';

/**
 * @description Returns the UNIX timestamp of date in seconds
 * @param date
 */
export const timestamp = (date?: Date): number => Math.floor((date || new Date()).getTime() / 1000);

/**
 * @description Returns the number of seconds in a given period
 * @param period 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'
 * @param numberOf number of minutes/hours/days/weeks/months/years that you want to calculate
 */
export const periodInSeconds = (
  period: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year',
  numberOf: number = 1
): number => {
  return moment(0).add(numberOf, period).unix();
};

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
 * @description Return a random integer between min & max (inclusive)
 */
export const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * @description Turn a UNIX timestamp (in seconds) into a Date
 */
export const unix = (date: number): Date => new Date(date * 1000);

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
 * @see https://www.typescriptlang.org/play?ts=4.0.5#code/KYOwrgtgBAsgngUXNA3gWAFBSgCWAG3wHsAaTbAOQEMJhMBfTTAYyJAGcj9gA6YgcwAUAeQBGAK2DMALjwDWwOO0HwkkAJTqA3EwysOXXgMEAiALQWT23fs7c+RIWMkyeANyr4wwZauSatIA
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
 * @description Filters a subset of assets from a list of provided assets
 * @param assets array of assets to filter
 * @param type the type of asset to include in the filter as AssetType
 * @param tags array of string tags to include in the filter
 * @returns array of assets
 */
export const findAssets = (assets: IAsset[] | IAssetStub[], type: AssetType, tags?: string[]) => {
  return assets.filter(asset => asset.type == type && (tags ? tags.every(tag => asset.tags.includes(tag)) : true));
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

/**
 * @description tooling for manipulating QuillJS rich text
 */
export const richtext = {
  /**
   * @description Create a simple plain text Rich string
   */
  create: (content: string): ParsedRichText => ({ ops: [{ insert: [content] }] }),
  /**
   * @description Convert RichText to ParsedRichText (consumed by QuillJS)
   */
  parse: (richtext: RichText): ParsedRichText => JSON.parse(richtext),
  /**
   * @description Convert QuillJS DeltaOperations to a RichText string (for storing in DB)
   */
  stringify: (ops: any[]) => JSON.stringify({ ops: ops }),
  /**
   * @description Convert all DeltaOps into a plain, format-less string
   */
  read: (text: RichText | ParsedRichText) =>
    (typeof text == 'string' ? richtext.parse(text) : text).ops.reduce((acc, curr) => ((acc += curr.insert), acc), '')
};

export const i18n = {
  /**
   * @description Take a locale & return a formatted code like en-GB or nb-NO
   */
  code: (locale: ILocale): string => `${locale.language}-${locale.region}`,

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
   * @param options optional object to specify format. Defaults to {timeStyle: 'short', dateStyle: 'full'} if none provided
   * @returns
   */
  date: (date: Date, locale: ILocale | string, options?: IDateTimeFormatOptions): string => {
    const formatOptions = options
      ? options
      : ({
          timeStyle: 'short',
          dateStyle: 'full'
        } as IDateTimeFormatOptions); // Typescript Intl.DateTimeFormat missing certain properties. See https://github.com/microsoft/TypeScript/issues/35865 and https://github.com/microsoft/TypeScript/issues/38266
    return new Intl.DateTimeFormat(
      typeof locale == 'string' ? locale : `${locale.language}-${locale.region}`,
      formatOptions
    ).format(date);
  }
};

/**
 * @description Pipes for pretty printing the:
 * - Card brand
 * - Refund Reason
 * from their respective enums
 */
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
  refundReason: (reason: RefundRequestReason): string => {
    const pretty: { [index in RefundRequestReason & BulkRefundReason]: string } = {
      [RefundRequestReason.Covid]: 'COVID-19',
      [RefundRequestReason.CancelledPostponed]: 'Event was cancelled/postponed',
      [RefundRequestReason.Duplicate]: 'Duplicate ticket/purchased twice',
      [RefundRequestReason.WrongTicket]: 'Wrong event purchased',
      [RefundRequestReason.Dissatisfied]: 'Dissatisfied with event',
      [RefundRequestReason.CannotAttend]: 'Unable to attend event',
      [RefundRequestReason.Other]: 'Other, please provide details below...',
      [BulkRefundReason.Cancelled]: 'Performance was cancelled',
      [BulkRefundReason.DateMoved]: 'Performance was rescheduled/ postponed',
      [BulkRefundReason.Overcharged]: 'Buyer was overcharged'
    };

    return pretty[reason];
  },
};

/**
 * @description Regexes for usage in validators in the front/back-end
 */
export const regexes = {
  url: /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})\/?/g,
  vat: /(GB)?(\d{12}|\d{9})/g
};
