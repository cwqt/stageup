// FIXME https://github.com/microsoft/TypeScript/issues/41651
// IMPORTANT Can't use template literal types until Angular 12 is out
// because the fix is in 4.2... which is not currently supported

export type i18nToken = string; //`@@${string}`;
export type i18nTokenMap = { [index: string]: string }; // index: i18nToken : string union

export interface ILocale {
  language: string;
  region: string;
}

export interface IDateTimeFormatOptions extends Intl.DateTimeFormatOptions {
  timeStyle?: 'short' | 'medium' | 'long' | 'full';
  dateStyle?: 'short' | 'medium' | 'long' | 'full';
}
