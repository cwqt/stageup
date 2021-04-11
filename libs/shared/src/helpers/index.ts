import { BASE_AMOUNT_MAP, CurrencyCode, DonoPeg, DONO_PEG_WEIGHT_MAPPING, Environment, NUUID, Primitive } from '@core/interfaces';
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
 * @description Takes an amount (in smallest currency denomination) and a currecy code, & returns a formatted string
 * like 1000 USD --> $10.00
 */
export const prettifyMoney = (amount: number, currency: CurrencyCode) => {
  // TODO: support locales other than en-GB money formatting
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: currency })
    .format(amount / 100) // amount should be stored in pennies
    .toString();
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
  filter?: { [index: string]: Primitive | Primitive[] };
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
 * @description inline object-type cast
 * @param value object to be cast as T
 * @see https://stackoverflow.com/a/38029708
 */
export function to<T>(value: T): T { return value; }

/**
 * @description Calculate the ticket donation amount from the selected peg and currency
 */
export const getDonoAmount = (donoPeg: DonoPeg, currency: CurrencyCode, allowAnyQty:number=0) => {
  return donoPeg == "allow_any"
    ? allowAnyQty
    : DONO_PEG_WEIGHT_MAPPING[donoPeg] * BASE_AMOUNT_MAP[currency];
}

/**
 * @description Find elements that exist in both a & b
 * @param inverse Invert the search, to find elements that don't exist in a or b
 * @returns Intersected elements
 */
export function intersect<T=Primitive>(a: T[], b: T[], inverse: boolean=false): T[] {
  return a.filter(x => b.includes(x) == !inverse);
}


/**
 * @description Picks at random 1 element from an array
 * @param arr
 * @returns
 */
export const sample = <T>(arr:T[]):T =>  arr[Math.floor(Math.random() * arr.length)];