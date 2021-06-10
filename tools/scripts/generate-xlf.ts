require('dotenv').config();
import * as fs from 'fs';
import Hjson from 'hjson';
import path from 'path';
import colors = require('colors');
import spawn from 'await-spawn';
import { exec } from 'child_process';
import xml from 'fast-xml-parser';
import { readFile } from 'fs';
import { string } from 'yargs';

if (!process.env.GCP_PROJECT_ID) console.log('Missing .env variable GCP_PROJECT_ID'.red), process.exit(0);
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS)
  console.log('Missing .env variable GOOGLE_APPLICATION_CREDENTIALS'.red), process.exit(0);

import Translate from '@google-cloud/translate';
const Translator = new Translate.v2.Translate({
  projectId: process.env.GCP_PROJECT_ID
});

import ora from 'ora';
const spinner = ora();

console.clear();

interface WorkspaceProject {
  root: string;
  sourceRoot: string;
  projectType: 'application' | 'library';
  i18n: {
    sources: string[];
    path?: string;
    locales: string[];
  };
  prefix: string;
  targets: any;
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

const XLF_CONFIG_FILENAME = 'xliffmerge.json';
const XLF_SOURCE_FILENAME = 'messages.source.json';

(async () => {
  console.log(colors.bold('StageUp xlf Generator'), 'using ngx-i18nsupport & Hjson\n');
  const workspace = JSON.parse((await fs.promises.readFile(path.resolve(process.cwd(), 'workspace.json'))).toString());

  // Find every project in the workspace.json with an i18n "source" entry, i.e. a folder with an i18n.hjson file
  // Angular handles the i18n differently by using @angular-devkit/build-angular:extract-i18n
  // & @ngx-i18nsupport/tooling:xliffmerge -- this tool is just for API localisation
  for await (let [project, data] of Object.entries<WorkspaceProject>(workspace.projects).sort(a =>
    a[1].i18n?.path ? 1 : -1
  )) {
    if (data.i18n?.path) {
      console.log(
        colors.magenta(
          `\nGenerating for ${colors.bold(data.i18n.path)} with locales: ${colors.bold(data.i18n.locales.join(', '))}`
        )
      );

      if (!data.i18n.sources) {
        console.log(colors.red.bold(`No sources for project!`));
        continue;
      }

      // Merge the source files into one big source map
      console.log('Collecting source files...');
      let tokens: { [code: string]: string };
      for await (let source of data.i18n.sources) {
        // Read in the i18n.hjson
        const buffer = await fs.promises
          .readFile(path.resolve(source))
          .catch(() => console.log(colors.red.bold(`${source} not found`)));

        // If there isn't a file, this'll be undefined, so skip this source
        if (!buffer) continue;

        const sourceTokens: { [code: string]: string } = Hjson.parse(buffer.toString());
        console.log(colors.green.bold(`Found ${source} with ${Object.keys(sourceTokens).length} trans units`));
        tokens = { ...tokens, ...sourceTokens };
      }

      // Check for missing tokens across all projects using grep
      // grep -nr --include="*.ts" --exclude-dir="node_modules" "@@" .
      try {
        await new Promise<void>((res, rej) => {
          exec(`grep -nr --include="*.ts" --exclude-dir="node_modules" "@@" .`, (err, stdout) => {
            if (err) rej(err);

            const lines = stdout.split('\n');
            // Grep returns something like
            // ./path/index.ts:143: [false, {}, '@@error.not_found'];
            // [code, line]
            const matches: Array<[string, string]> = lines
              .reduce((acc, line) => {
                const code = line.match(/"@@(.*?)"|'@@(.*?)'/g);
                if (code?.length) {
                  // match from start of string up until the .ts:line_number_indicator
                  // remove all special chars, except alphanumber & periods, underscores & hyphens
                  acc = acc.concat(
                    code.map(code => [code.replace(/[^0-9a-z\.\_\-]/gi, ''), line.match(/^.*\.ts:\d*(?=:)/g)?.[0]])
                  );
                }

                return acc;
              }, [])
              // Remove all the found values from this file
              .filter(([code, line]) => !line.includes('generate-xlf'));

            const missing: Map<string, string[]> = new Map();
            matches.forEach(([code, lines]) => {
              if (!tokens[code]) {
                if (!missing.get(code)) {
                  missing.set(code, [lines]);
                } else {
                  missing.set(code, [...missing.get(code), lines]);
                }
              }
            });

            if (missing.size == 0) {
              console.log(colors.green.bold('Project has all tokens!'));
              return res();
            } else {
              for (let [code, lines] of missing.entries()) {
                console.log(`${colors.red.bold(code)} missing in ${lines.length} file(s)`);
                lines.forEach(line => console.log(colors.gray(`  | ${line}`)));
                console.log('');
              }

              console.log(`${missing.size} tokens are missing from the i18n.hjson files!`);
              process.exit(0);
            }
          });
        });
      } catch (error) {
        console.log(error);
      }

      // Generate the Source XLF file, for purposes of merging new entries into existing XLFs
      console.log(`Creating source XLF file... `);
      const sourcePath = path.resolve(process.cwd(), data.i18n.path);
      const source = createSourceXlf(Object.entries(tokens).map(createSourceXlfTransUnit));

      // Delete the old source file & write the new one
      await fs.promises.unlink(path.resolve(sourcePath, XLF_SOURCE_FILENAME)).catch(() => {});
      await fs.promises.writeFile(path.resolve(sourcePath, XLF_SOURCE_FILENAME), source);

      // Generate the config file for xliff-merge to consume when it runs in a child thread
      console.log('Creating xliffmerge.json...');
      await fs.promises.writeFile(
        path.resolve(sourcePath, XLF_CONFIG_FILENAME),
        generateXliffMergeConfig(sourcePath, sourcePath, data.i18n.locales)
      );

      console.log('Generating locale files...');
      // Tool uses the same xliff generator that our Angular project does, it consumes a base
      // messages.xlf file which contains all the source trans-units - and then for each locale,
      // merges the existing locale xlf files (if any), with the base xlf to update; for if any
      // new codes were added to the i18n.hjson
      try {
        // https://github.com/martinroob/ngx-i18nsupport/issues/144#issuecomment-801019865
        await spawn('node', [
          path.resolve(__dirname, 'xliffmerge-hack.js'),
          '--profile',
          path.resolve(sourcePath, XLF_CONFIG_FILENAME),
          '-v'
        ]);
      } catch (e) {
        console.log(e.stderr.toString());
        console.log(e.stdout.toString());
        process.exit(0);
      }

      // Remove all the config/source files that we don't need anymore
      console.log('Deleting config...');
      await fs.promises.unlink(path.resolve(sourcePath, 'xliffmerge.json'));
      await fs.promises.unlink(path.resolve(sourcePath, XLF_SOURCE_FILENAME));

      // Read the merged XLF file, and translate the missing tokens with Google Translate
      await (async () => {
        console.log('Checking for new tokens to auto-translate...');
        for await (let locale of data.i18n.locales) {
          const file = await new Promise((res, rej) =>
            readFile(path.resolve(data.i18n.path, `messages.${locale}.xlf`), { encoding: 'utf-8' }, (err, data) => {
              if (err) return rej(err);
              res(data);
            })
          );

          // Parse to JSON so we can iterate over all the nodes, for translating
          const xliff: { xliff: Xliff; [index: string]: any } = await xml.parse(file.toString(), {
            // Use prefix so the parser knows which fields are XML attributes
            attributeNamePrefix: '@_',
            ignoreAttributes: false,
            ignoreNameSpace: false,
            allowBooleanAttributes: false,
            parseNodeValue: true,
            parseAttributeValue: true,
            trimValues: true,
            parseTrueNumberOnly: false
          });

          // For parsing back into XML from JSON
          const parser = new xml.j2xParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

          // Get all nodes whose state is new
          const untranslatedCodes: Array<{ _id: string; text: string }> = xliff.xliff.file.body['trans-unit'].reduce(
            (acc, curr) => (
              curr.target['@_state'] == 'new' && acc.push({ _id: curr['@_id'], text: curr['target']['#text'] }), acc
            ),
            []
          );

          if (untranslatedCodes.length) {
            console.log(`Translating ${untranslatedCodes.length} new ${locale} tokens...`);
            spinner.start();
            for await (let { _id, text } of untranslatedCodes) {
              spinner.text = `Translating: ${_id}`.gray;
              // Since we use ICU formatting, we have variables inside e.g. {this_is_a_var}
              // that may get translated -> {amount} => {beløp}, so we need to replace all these with some substring
              // that definitely __won't__ get translated - $$TRANS_REPLACE_n
              const matches = text.match(/\{(.*?)\}/g);
              matches?.forEach((match, idx) => (text = text.replace(match, `TRANS_REPLACE_${idx}`)));

              // Do the translating!
              let [translation] = await Translator.translate(text, locale);

              // And now put the match codes back in place within the translated string...
              matches?.forEach((match, idx) => (translation = translation.replace(`TRANS_REPLACE_${idx}`, match)));

              // Set all the metadata & new value of the trans-unit
              const unit = xliff.xliff.file.body['trans-unit'].find(unit => unit['@_id'] == _id);
              unit.target['@_state'] = 'translated';
              unit.target['#text'] = translation;
            }
          }

          spinner.text = 'Saving XML...';
          fs.writeFileSync(path.resolve(data.i18n.path, `messages.${locale}.xlf`), parser.parse(xliff));
          spinner.stop();
        }
      })();

      // Auto-generate a string union types file for use in the code so we're not shooting blind
      console.log('Generating token union types file...');
      const types = generateTokenUnionFile(tokens);
      fs.writeFileSync(path.resolve(sourcePath, 'i18n-tokens.autogen.ts'), types, { flag: 'w' });

      console.log(colors.green.bold('Done!'));
    } else {
      console.log(colors.gray(`Skipping ${colors.bold(project)}, no 'path' in i18n`));
    }
  }
})();

const generateTokenUnionFile = (tokens: { [code: string]: string }): string => {
  // Want something like
  // ["@@some.token"]: "arg1" | "arg2" | "argn";
  const tsMap = Object.entries(tokens).reduce((acc, [token, str]) => {
    const matches = str.match(/\{(.*?)\}/g);
    acc.push(`["@@${token}"]: ${matches?.map(m => `"${m.slice(1, -1)}"`).join(' | ') || 'never'}`);
    return acc;
  }, []);

  return `// AUTO GENERATED FILE, CHANGES WILL BE LOST -------------------
// to regenerate run:
//   npm run generate:xlf
// -------------------------------------------------------------
export type AUTOGEN_i18n_TOKEN_MAP = {
${tsMap.map(t => `  ${t}`).join(',\n')}
}
`;
};

const createSourceXlfTransUnit = ([id, message]: [string, string]): string => {
  // <trans-unit id="header-search-bar" datatype="html">
  //  <source>Search for performances...</source>
  // </trans-unit>
  return `<trans-unit id="${id}" datatype="html"><source>${message}</source></trans-unit>\n`;
};

const createSourceXlf = (body: string[]): string => {
  //  <file source-language="en" datatype="plaintext" original="generate-xlf">
  return `<?xml version="1.0" encoding="UTF-8"?>
  <xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
    <file source-language="en" datatype="plaintext" original="generate-xlf">
      <body>
${body.reduce((acc, curr) => ((acc += `\t\t\t\t${curr}`), acc), '')}\t\t\t</body>
    </file>
  </xliff>
`;
};

const generateXliffMergeConfig = (srcDir: string, genDir: string, locales: string[]): string => {
  return JSON.stringify(
    {
      xliffmergeOptions: {
        srcDir: srcDir,
        genDir: genDir,
        i18nFile: XLF_SOURCE_FILENAME,
        i18nBaseFile: 'messages',
        i18nFormat: 'xlf',
        encoding: 'UTF-8',
        defaultLanguage: 'en',
        languages: locales
      }
    },
    null,
    2
  );
};
