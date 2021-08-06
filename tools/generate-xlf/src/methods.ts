import * as fs from 'fs';
import YAML from 'yaml';
import path from 'path';
import colors = require('colors');
import spawn from 'await-spawn';
import { exec } from 'child_process';
import { readFile as fsReadFile } from 'fs';
import Translate from '@google-cloud/translate';
import ora = require('ora');
import md from 'markdown-it';
import dot from 'dot-object';
import { MD5 } from 'object-hash';
import xlf from './parser';
const replaceAll = require('string.prototype.replaceall');
replaceAll.shim(); //es6 polyfill

// https://github.com/markdown-it/markdown-it/blob/master/lib/rules_core/replacements.js
// Typographer does the following replacements:
// (c) (C) → ©
// (tm) (TM) → ™
// (r) (R) → ®
// +- → ±
// (p) (P) -> §
// ... → … (also ?.... → ?.., !.... → !..)
// ???????? → ???, !!!!! → !!!, `,,` → `,`
// -- → &ndash;, --- → &mdash;
const markdownRenderer = new md({ typographer: true, html: true });
markdownRenderer.normalizeLink = v => v; // don't encode vars in links from {url} to %7Burl%7D
markdownRenderer.validateLink = v => true; // allow every kind of link

export const createSourceXlfTransUnit = ([id, message]: [string, string]): string => {
  // <trans-unit id="header-search-bar" datatype="html">
  //  <source>Search for performances...</source>
  // </trans-unit>
  return `<trans-unit id="${id}" datatype="html"><source>${message}</source></trans-unit>\n`;
};

export const createXlf = (body: string[], sourceLanguage: string = 'en', targetLanguage?: string): string => {
  //  <file source-language="en" datatype="plaintext" original="generate-xlf">
  return `<?xml version="1.0" encoding="UTF-8"?>
  <xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
    <file source-language="${sourceLanguage}" ${
    targetLanguage ? `target-language="${targetLanguage}"` : ''
  } datatype="plaintext" original="generate-xlf">
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
    // Read in the i18n.yaml
    const buffer = await fs.promises
      .readFile(path.resolve(source))
      .catch(() => console.log(colors.red.bold(`${source} not found`)));

    // If there isn't a file, this'll be undefined, so skip this source
    if (!buffer) continue;

    const sourceTokens: { [code: string]: string } = YAML.parse(buffer.toString());

    // Flatten object down into "some.dot.accessor" object
    tokens = dot.dot({ ...tokens, ...sourceTokens });
  }

  return tokens;
};

export const findMissingTokens = async (
  sourcePath: string,
  tokens: { [code: string]: string }
): Promise<Map<string, string[]>> => {
  // Check for missing tokens across all projects using grep
  // grep -nr --include="*.ts" --exclude-dir="node_modules" "@@" .
  try {
    return await new Promise((res, rej) => {
      exec(
        `grep -nr --include="*.ts" --exclude-dir="node_modules" "@@" ${path.resolve(sourcePath)}`,
        (err, stdout, stderr) => {
          if (err) console.error(stderr, stdout), rej(err);
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
            .filter(v => !v.includes('i18n-tokens.autogen.ts'));

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
            return res(missing);
          } else {
            for (let [code, lines] of missing.entries()) {
              console.log(`${colors.red.bold(code)} missing in ${lines.length} file(s)`);
              lines.forEach(line => console.log(colors.gray(`  | ${line}`)));
              console.log('');
            }

            console.log(`${missing.size} tokens are missing from the i18n.yaml files!`);
            return res(missing);
          }
        }
      );
    });
  } catch (error) {
    console.log(error);
  }
};

export const convertMarkdownTokensToHtml = async (tokens: {
  [code: string]: string;
}): Promise<{ [code: string]: string }> =>
  Object.entries(tokens).reduce((acc, [code, markdown]) => {
    const urls = markdown.match(/\<\{.*\}\>/g);

    // Strings that contain new-lines are multi-line strings & so should not use the inlineRenderer
    // Normal renderer doesn't wrap text in a <p> tag
    const isMulitline = markdown.includes('\n');
    const renderer = isMulitline
      ? markdownRenderer.render.bind(markdownRenderer)
      : markdownRenderer.renderInline.bind(markdownRenderer);

    if (urls) {
      const url = 'https://please-replace-me.com';
      const map = urls.reduce((acc, curr) => {
        acc[curr] = `${url}/${MD5(curr)}`;
        return acc;
      }, {});

      // so the markdown parser won't parse <{url}> as a <a> tag unless the contents of <>
      // meets a valid url rule - so swap out {url} with url/hash, do the markdowning, and then
      // replace the ICU variable back in.....jesus christ this fucking sucks
      urls?.forEach(match => (markdown = markdown.replace(match, `<${map[match]}>`)));

      // for every <{}> that exists there will now be 2 to take its place, hence md5 hash
      // <{url}> --> <a href="{url}">{url}</a>
      // Render markdown using inline/multi-line renderer
      markdown = renderer(markdown);

      // And now put the match codes back in place, removing the <> from <{}> to leave only the ICU var
      urls.forEach(match => {
        markdown = markdown.replaceAll(`${map[match]}`, match.replaceAll(/\<|\>/g, ''));
      });
    } else {
      markdown = renderer(markdown);
    }

    acc[code] = markdown;
    return acc;
  }, {});

export const writeSourceXlfFile = async (sourcePath: string, tokens: { [code: string]: string }) => {
  // Generate the Source XLF file, for purposes of merging new entries into existing XLFs
  const completeSourcePath = path.resolve(process.cwd(), sourcePath);
  const source = createXlf(Object.entries(tokens).map(createSourceXlfTransUnit));

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
  // new codes were added to the i18n.yaml
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
    throw new Error('Merging XLFs failed!');
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

export const fixCharacterEntityProblems = async (sourcePath: string): Promise<{ [filename: string]: string }> => {
  // Often times problems like "& amp;" occur, where there's a space between the & and the code
  // Scan all .xlfs for &.*; and replace any spaces with nothing
  const files = fs.readdirSync(sourcePath).filter(f => f.endsWith('.xlf'));
  const bodies = {};

  for await (const file of files) {
    let body = await readFile(path.resolve(sourcePath, file));
    const matches = [...new Set(body.match(/&\s.*?;/g) || [])];
    // Replace all whitespace in matches
    matches.forEach(match => (body = body.replaceAll(match, match.replace(/\s/g, ''))));

    // Perform character replacements
    const replacements = {
      ['&amp;']: '&',
      ['&quot;']: "'",
      ['&lt;']: '<',
      ['@ ']: '@' // translation likes to do '@ username', rather than '@username'
    };
    for (let [target, replacement] of Object.entries(replacements)) {
      body = body.replaceAll(target, replacement);
    }

    bodies[file] = body;
    fs.writeFileSync(path.resolve(sourcePath, file), body);
  }

  return bodies;
};

export const translateICUString = async (
  input: string,
  locale: string,
  Translator: InstanceType<typeof Translate['v2']['Translate']>
): Promise<string> => {
  // Since we use ICU formatting, we have variables inside e.g. {this_is_a_var}
  // that may get translated -> {amount} => {beløp}, so we need to replace all these with some substring
  // that definitely __won't__ get translated - $$TRANS_REPLACE_n
  // also capture <x /> tags from angulars' extract-i18n tooling
  const variables = input.match(/\{(.*?)\}|<x.*\/>/g);
  variables?.forEach((match, idx) => (input = input.replace(match, `VAR_REPLACE_${idx}`)));

  // Also need to replace <x/> self-closing tags!
  // equiv-text can contain html so need to be a bit smarted with handling this one
  const xTags = input.match(/<x(.*?)(?<=equiv-text=".*"\/>)/gms);
  xTags?.forEach((match, idx) => (input = input.replace(match, `X_TAG_REPLACE_${idx}`)));

  // Do the translating!
  let [translation] = await Translator.translate(input, locale);

  // And now put the match codes back in place within the translated string...
  variables?.forEach((match, idx) => (translation = translation.replace(`VAR_REPLACE_${idx}`, match)));
  xTags?.forEach((match, idx) => (translation = translation.replace(`X_TAG_REPLACE_${idx}`, match)));

  return translation;
};

export const translateUntranslatedTransUnits = async (sourcePath: string, locales: string[]) => {
  const spinner = ora();
  spinner.text = 'Translating new un-translated tokens...'.gray;
  spinner.start();

  // Setup the translator before the locale loop
  const Translator = new Translate.v2.Translate({
    projectId: process.env.GCP_PROJECT_ID
  });

  // Begin translation each trans unit of each locale
  for await (let locale of locales) {
    spinner.prefixText = locale;

    // Get all trans-units from locale XLF file
    const parsed = await xlf.parse(path.resolve(sourcePath, `messages.${locale}.xlf`));

    // Translate all newly added tokens using GCP Translate API
    for await (let unit of parsed.trans_units) {
      if (unit.state == 'new') {
        spinner.text = `Translating: ${unit.id}`.gray;
        unit.target = await translateICUString(unit.target, locale, Translator);

        // Mark as needing to be double checked by a human
        unit.state = 'needs-translation';
        console.log(unit);
      }
    }

    spinner.text = 'Saving XML...'.gray;
    await xlf.save(path.resolve(sourcePath, `messages.${locale}.xlf`), parsed);
  }

  spinner.text = 'Translating new un-translated tokens...'.gray;
  spinner.prefixText = null;
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
      res(data.toString());
    })
  );

  return file;
};
