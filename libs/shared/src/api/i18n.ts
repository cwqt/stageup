import { i18nToken, ILocale, Primitive } from '@core/interfaces';
import xml from 'fast-xml-parser';
import { readFile } from 'fs';
import IntlMessageFormat from 'intl-messageformat';
import { Logger } from 'winston';
import { Service } from 'typedi';
import path = require('path');
import colors = require('colors');

export interface Ii18nConfig {
  locales: string[];
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
export class i18nProvider {
  config: Ii18nConfig;
  locales: Map<string, Map<string, string>>; // locale : ( code : icu message )

  constructor(config: Ii18nConfig) {
    this.config = config;
  }

  async setup(logger: Logger) {
    this.locales = new Map();

    // contains messages.locale.xlf files
    for await (let locale of this.config.locales) {
      logger.debug(`Loading locale ${locale}...`);
      const file = await new Promise((res, rej) =>
        readFile(path.resolve(this.config.path, `messages.${locale}.xlf`), { encoding: 'utf-8' }, (err, data) => {
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
        parseTrueNumberOnly: false
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
        locale,
        new Map(
          xliff.file.body['trans-unit'].map(unit => [
            unit['@_id'],
            // un-escape markdown stuff
            unit.target['#text']?.replace(/(&lt;)|(&gt;)/g, m => ({ '&lt;': '<', '&gt;': '>' }[m]))
          ])
        )
      );
    }

    return this;
  }

  translate(code: i18nToken, locale: ILocale, variables?: { [index: string]: Primitive }): string {
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
