import * as fs from 'fs';
import Hjson from 'hjson';
import path from 'path';
import colors = require('colors');
import spawn from 'await-spawn';
import { exec } from 'child_process';
import xml from 'fast-xml-parser';
import { readFile as fsReadFile } from 'fs';
import { Xliff } from './interfaces';
import Translate from '@google-cloud/translate';
import ora = require('ora');

export const createSourceXlfTransUnit = ([id, message]: [string, string]): string => {
  // <trans-unit id="header-search-bar" datatype="html">
  //  <source>Search for performances...</source>
  // </trans-unit>
  return `<trans-unit id="${id}" datatype="html"><source>${message}</source></trans-unit>\n`;
};

export const createSourceXlf = (body: string[]): string => {
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

export const generateXliffMergeConfig = (srcDir: string, genDir: string, locales: string[]): string => {
  return JSON.stringify(
    {
      xliffmergeOptions: {
        srcDir: srcDir,
        genDir: genDir,
        i18nFile: 'messages.source.xlf',
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

export const extractTokensFromSources = async (sources: string[]): Promise<{ [index: string]: string }> => {
  // Merge the source files into one big source map
  let tokens: { [code: string]: string };
  for await (let source of sources) {
    // Read in the i18n.hjson
    const buffer = await fs.promises
      .readFile(path.resolve(source))
      .catch(() => console.log(colors.red.bold(`${source} not found`)));

    // If there isn't a file, this'll be undefined, so skip this source
    if (!buffer) continue;

    const sourceTokens: { [code: string]: string } = Hjson.parse(buffer.toString());
    tokens = { ...tokens, ...sourceTokens };
  }
  return tokens;
};

export const findMissingTokens = async (tokens: { [code: string]: string }) => {
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
};

export const writeSourceXlfFile = async (sourcePath: string, tokens: { [code: string]: string }) => {
  // Generate the Source XLF file, for purposes of merging new entries into existing XLFs
  const completeSourcePath = path.resolve(process.cwd(), sourcePath);
  const source = createSourceXlf(Object.entries(tokens).map(createSourceXlfTransUnit));

  // Delete the old source file & write the new one
  await fs.promises.unlink(path.resolve(completeSourcePath, 'messages.source.xlf')).catch(() => {});
  await fs.promises.writeFile(path.resolve(completeSourcePath, 'messages.source.xlf'), source);
};

export const writeXliffMergeConfig = async (sourcePath: string, locales: string[]) => {
  // Generate the config file for xliff-merge to consume when it runs in a child thread
  await fs.promises.writeFile(
    path.resolve(sourcePath, 'xliffmerge.config.json'),
    generateXliffMergeConfig(path.resolve(process.cwd(), sourcePath), path.resolve(process.cwd(), sourcePath), locales)
  );
};

export const writeLocaleXlfFiles = async (sourcePath: string) => {
  // Tool uses the same xliff generator that our Angular project does, it consumes a base
  // messages.xlf file which contains all the source trans-units - and then for each locale,
  // merges the existing locale xlf files (if any), with the base xlf to update; for if any
  // new codes were added to the i18n.hjson
  try {
    // https://github.com/martinroob/ngx-i18nsupport/issues/144#issuecomment-801019865
    await spawn('node', [
      path.resolve(__dirname, 'xliffmerge-hack.js'),
      '--profile',
      path.resolve(sourcePath, 'xliffmerge.config.json'),
      '-v'
    ]);
  } catch (e) {
    console.log(e.stderr.toString());
    console.log(e.stdout.toString());
    process.exit(0);
  }
};

export const writeICUVarTypesFile = async (sourcePath: string, tokens: { [code: string]: string }) => {
  // Auto-generate a string union types file for use in the code so we're not shooting blind
  // Want something like
  // ["@@some.token"]: "arg1" | "arg2" | "argn";
  const tsMap = Object.entries(tokens).reduce((acc, [token, str]) => {
    const matches = str.match(/\{(.*?)\}/g);
    acc.push(`["@@${token}"]: ${matches?.map(m => `"${m.slice(1, -1)}"`).join(' | ') || 'never'}`);
    return acc;
  }, []);

  const types = `// AUTO GENERATED FILE, CHANGES WILL BE LOST -------------------
// to regenerate run:
//   npm run generate:xlf
// -------------------------------------------------------------
export type AUTOGEN_i18n_TOKEN_MAP = {
${tsMap.map(t => `  ${t}`).join(',\n')}
}
`;

  fs.writeFileSync(path.resolve(sourcePath, 'i18n-tokens.autogen.ts'), types, { flag: 'w' });
};

export const executePrerunFunction = async (command: string) => {
  const parts = command.split(' ');
  await spawn(parts.shift(), parts, { shell: true, stdio: 'inherit' });
};

export const fixCharacterEntityProblems = async (sourcePath: string) => {
  // Often times problems like "& amp;" occur, where there's a space between the & and the code
  // Scan all .xlfs for &.*; and replace any spaces with nothing
  const files = fs.readdirSync(sourcePath).filter(f => f.endsWith('.xlf'));

  for await (const file of files) {
    let body = await readFile(path.resolve(sourcePath, file));
    const matches = [...new Set(body.match(/&\s.*?;/g) || [])];
    // Replace all whitespace in matches
    matches.forEach(match => (body = body.replaceAll(match, match.replace(/\s/g, ''))));
    fs.writeFileSync(path.resolve(sourcePath, file), body);
  }
};

export const translateUntranslatedTransUnits = async (sourcePath: string, locales: string[]) => {
  const spinner = ora();
  spinner.text = 'Translating new un-translated tokens...'.gray;
  spinner.start();
  const Translator = new Translate.v2.Translate({
    projectId: process.env.GCP_PROJECT_ID
  });

  for await (let locale of locales) {
    const file = await readFile(path.resolve(sourcePath, `messages.${locale}.xlf`));

    // Parse to JSON so we can iterate over all the nodes, for translating
    const xliff: { xliff: Xliff; [index: string]: any } = await xml.parse(file.toString(), {
      // Use prefix so the parser knows which fields are XML attributes
      attributeNamePrefix: '@_',
      ignoreAttributes: false,
      ignoreNameSpace: false,
      allowBooleanAttributes: false,
      trimValues: true,
      // angular i18n-tooling generates random ids for trans-units which are numbers (as strings) with a
      // size > 2^53 bits, so we will lose precision on the trans unit ids if it attempts to parse values
      // if we allow this lib to coerce from string -> num, the resulting ids won't match because the
      // precision loss (replaced with 0's) - so lets leave them as strings :)
      parseAttributeValue: false,
      parseNodeValue: false
    });

    // For parsing back into XML from JSON
    const parser = new xml.j2xParser({ ignoreAttributes: false, attributeNamePrefix: '@_', format: true });

    // Get all nodes whose state is new
    const untranslatedCodes: Array<{ _id: string; text: string }> = xliff.xliff.file.body['trans-unit'].reduce(
      (acc, curr) => (
        curr.target['@_state'] == 'new' && acc.push({ _id: curr['@_id'], text: curr['target']['#text'] }), acc
      ),
      []
    );

    if (untranslatedCodes.length) {
      spinner.prefixText = locale;

      for await (let { _id, text } of untranslatedCodes) {
        spinner.text = `Translating: ${_id}`.gray;
        // Since we use ICU formatting, we have variables inside e.g. {this_is_a_var}
        // that may get translated -> {amount} => {beløp}, so we need to replace all these with some substring
        // that definitely __won't__ get translated - $$TRANS_REPLACE_n
        const matches = text.match(/\{(.*?)\}/g);
        matches?.forEach((match, idx) => (text = text.replace(match, `TRANS_REPLACE_${idx}`)));

        // Do the translating!
        let [translation] = await Translator.translate(text, locale);
        // let translation = 'fuck you';

        // And now put the match codes back in place within the translated string...
        matches?.forEach((match, idx) => (translation = translation.replace(`TRANS_REPLACE_${idx}`, match)));

        // Set all the metadata & new value of the trans-unit
        const unit = xliff.xliff.file.body['trans-unit'].find(unit => unit['@_id'] == _id);
        unit.target['@_state'] = 'needs-translation'; // mark as needing to be checked over by a human
        unit.target['#text'] = translation;
      }
    }

    fs.writeFileSync(path.resolve(sourcePath, `messages.${locale}.xlf`), parser.parse(xliff));
    spinner.text = 'Saving XML...'.gray;
  }

  spinner.text = 'Translating new un-translated tokens...'.gray;
  spinner.prefixText = '';
  spinner.succeed();
  spinner.stop();
};

export const cleanupXlfGeneration = async (sourcePath: string) => {
  await fs.promises.unlink(path.resolve(sourcePath, 'xliffmerge.config.json'));
  await fs.promises.unlink(path.resolve(sourcePath, 'messages.source.xlf'));
};

export const s = async <T>(promise: Promise<T>, description: string): Promise<T> => {
  const spinner = ora();
  spinner.text = (description + '...').gray;
  spinner.start();
  try {
    const res = await promise;
    spinner.succeed();
    return res;
  } catch (error) {
    spinner.fail();
    console.log(error);
  } finally {
    spinner.stop();
  }
};

export const readFile = async (path: string): Promise<string> => {
  const file = await new Promise<string>((res, rej) =>
    fsReadFile(path, { encoding: 'utf-8' }, (err, data) => {
      if (err) return rej(err);
      res(data);
    })
  );

  return file;
};
