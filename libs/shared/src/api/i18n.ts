import { i18n } from '@core/helpers';
import { CurrencyCode, i18nTokenMap, ILocale, Primitive } from '@core/interfaces';
import xml from 'fast-xml-parser';
import { readFile } from 'fs';
import IntlMessageFormat from 'intl-messageformat';
import { Service } from 'typedi';
import { Logger } from 'winston';
import path = require('path');
import colors = require('colors');

export interface Ii18nConfig {
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

@Service({ id: 'i18n' })
export class i18nProvider<TokenMap extends i18nTokenMap> {
  config: Ii18nConfig;
  locales: Map<string, Map<string, string>>; // locale : ( code : icu message )

  constructor(config: Ii18nConfig) {
    this.config = config;
  }

  async setup(logger: Logger) {
    this.locales = new Map();

    // contains messages.locale.xlf files
    for await (let { language, region } of this.config.locales) {
      logger.debug(`Loading locale ${language}-${region}...`);
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
        logger.warn(
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
    return i18n.code(locale);
  }

  money(amount: number, currency: CurrencyCode) {
    return i18n.money(amount, currency);
  }

  date(date: Date, locale: ILocale): string {
    return i18n.date(date, locale);
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
        `${locale.language}-${locale.region}`
      );

      return msg.format(variables || {}) as string;
    }
  }
}
