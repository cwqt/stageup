import { CurrencyCode, Environment, NUUID, Primitive } from '@core/interfaces';
import { nanoid } from 'nanoid';
/**
 * @description Returns the UNIX timestamp of date in seconds
 * @param date
 */
export const timestamp = (date?: Date): number => Math.floor((date || new Date()).getTime() / 1000);

/**
 * @description Delay async execution for a duration
 * @param duration time in milli-seconds
 */
export const timeout = (duration:number=1000) => new Promise(resolve => setTimeout(resolve, duration));

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
 * @example
 * enum Test { hello = "world" }
 * enumToValues(Test) // ["world"]
 */
export const enumToValues = <T = string>(enumme: any): T[] => {
  return Object.keys(enumme)
    .map(key => enumme[key])
    .filter(value => typeof value === 'string') as T[];
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
