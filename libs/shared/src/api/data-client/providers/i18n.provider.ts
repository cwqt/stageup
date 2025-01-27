import { i18n as i18nMethods } from '@core/helpers';
import { CurrencyCode, i18nTokenMap, ILocale, Primitive } from '@core/interfaces';
import xml from 'fast-xml-parser';
import { readFile } from 'fs';
import IntlMessageFormat from 'intl-messageformat';
import Container, { Service, Token } from 'typedi';
import path = require('path');
import colors = require('colors');
import { Logger } from '../../data-client/providers/logging.provider';
import { Provider } from '../../data-client';
import { LOGGING_PROVIDER } from '../../data-client/tokens';

export interface i18n<TokenMap extends i18nTokenMap = { [index: string]: string }> {
  code: (locale: ILocale) => string;
  money: (amount: number, currency: CurrencyCode) => string;
  date: (date: Date, locale: ILocale) => string;
  translate: <T extends Extract<keyof TokenMap, string>>(
    code: T,
    locale: ILocale,
    variables?: { [index in TokenMap[T]]: Primitive }
  ) => string;
}

export interface XLFi18nProviderConfig {
  locales: ReadonlyArray<ILocale>;
  path: string;
}

interface Xliff {
  file: {
    body: {
      ['trans-unit']: Array<{
        '@_id': string;
        source: string;
        target: { ['#text']: string; '@_state': 'new' | 'final' | 'translated' };
      }>;
    };
  };
}

@Service()
export class XLFi18nProvider<TokenMap extends i18nTokenMap> implements Provider<i18n<TokenMap>> {
  name = 'XLF i18n';
  config: XLFi18nProviderConfig;
  locales: Map<string, Map<string, string>>; // locale : ( code : icu message )
  connection: i18n<TokenMap>;

  private log: Logger;

  constructor(config: XLFi18nProviderConfig) {
    this.config = config;
    this.log = Container.get(LOGGING_PROVIDER);
  }

  async connect() {
    this.locales = new Map();

    // contains messages.locale.xlf files
    for await (let { language, region } of this.config.locales) {
      this.log.debug(`Loading locale ${language}-${region}...`);
      const file = await new Promise((res, rej) =>
        readFile(path.resolve(this.config.path, `messages.${language}.xlf`), { encoding: 'utf-8' }, (err, data) => {
          if (err) return rej(err);
          res(data);
        })
      );

      const { xliff }: { xliff: Xliff } = await xml.parse(file.toString(), {
        ignoreAttributes: false,
        ignoreNameSpace: false,
        allowBooleanAttributes: false,
        parseNodeValue: true,
        parseAttributeValue: true,
        trimValues: true,
        parseTrueNumberOnly: false,
        stopNodes: ['target', 'source'] // don't parse target tags otherwise will parse html as xml & incorrectly set map value
      });

      const missingCodes = xliff.file.body['trans-unit'].reduce(
        (acc, curr) => (curr.target['@_state'] == 'new' && acc.push(curr['@_id']), acc),
        []
      );

      if (missingCodes.length > 0) {
        this.log.warn(
          `Found ${missingCodes.length} missing translations in this locale:\n ${colors.gray(missingCodes.join(', '))}`
        );
      }

      // Pull out xliff data into code : translation map
      this.locales.set(
        language,
        new Map(xliff.file.body['trans-unit'].map(unit => [unit['@_id'], unit.target['#text']]))
      );
    }

    return this;
  }

  code(locale: ILocale) {
    return i18nMethods.code(locale);
  }

  money(amount: number, currency: CurrencyCode) {
    return i18nMethods.money(amount, currency);
  }

  date(date: Date, locale: ILocale): string {
    return i18nMethods.date(date, locale);
  }

  translate<T extends Extract<keyof TokenMap, string>>(
    code: T,
    locale: ILocale,
    variables?: { [index in TokenMap[T]]: Primitive }
  ): string {
    const translation = this.locales.get(locale.language)?.get(code.slice(2));

    if (!translation) {
      return this.locales.get(locale.language)?.get('error.missing_translation') + ` (${code})`;
    } else {
      const msg = new IntlMessageFormat(
        this.locales.get(locale.language).get(code.slice(2)),
        `${locale.language}-${locale.region}`,
        {},
        { ignoreTag: true }
      );

      return msg.format(variables || {}) as string;
    }
  }

  async disconnect() {}
}
