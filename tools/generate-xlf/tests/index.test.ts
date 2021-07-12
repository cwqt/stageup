require('dotenv').config();
import { WorkspaceProject } from '../src/interfaces';
import * as fs from 'fs';
import path from 'path';
import {
  extractTokensFromSources,
  findMissingTokens,
  writeSourceXlfFile,
  writeXliffMergeConfig,
  writeLocaleXlfFiles,
  cleanupXlfGeneration,
  writeICUVarTypesFile,
  translateICUString
} from '../src/methods';
import Translate from '@google-cloud/translate';

describe('generate:xlf unit tests', () => {
  let project: WorkspaceProject;
  let tokens: { [index: string]: string };

  beforeAll(async () => {
    const workspace = JSON.parse(
      (
        await fs.promises.readFile(path.resolve(process.cwd(), 'tools/generate-xlf/tests/assets/workspace.test.json'))
      ).toString()
    );

    project = workspace.projects.test;
  });

  it('Should have the test workspace file with all locales & correct paths', async () => {
    expect(project.root).toEqual('tools/generate-xlf/tests');
    expect(project.i18n.locales).toEqual(expect.arrayContaining(['en', 'nb', 'cy']));
    expect(project.i18n.sources[0]).toEqual('tools/generate-xlf/tests/assets/i18.test.hjson');
    expect(project.i18n.path).toEqual('tools/generate-xlf/tests/assets/i18n');
  });

  // const tokens = await s(extractTokensFromSources(project.i18n.sources), 'Extracting i18n tokens from .hjson files');
  it('Should extract i18n tokens from .hjson files', async () => {
    const t = await extractTokensFromSources(project.i18n.sources);
    expect(t['1']).toEqual('Hello World!');
    expect(t['2']).toEqual('This is a {variable} and {another}');
    expect(t['3']).toEqual('_*One*_ & two; three four! __Punctuation__ on the floor...');
    expect(t['4']).toEqual('File type {inputElement.files[0].type} not allowed');

    tokens = t; // make global for next test
  });

  // await s(findMissingTokens(tokens), 'Checking for missing tokens in the code');
  it('Should check for missing tokens in the code', async () => {
    const missing = await findMissingTokens(project.sourceRoot, tokens);
    expect(missing.has('should_be_missing')).toBe(true);
    expect(missing.has('not_missing')).toBe(false);
  });

  // await s(writeSourceXlfFile(sourcePath, tokens), 'Writing a source .xlf translation file');
  it('Should write a source .xlf translation file', async () => {
    await writeSourceXlfFile(project.sourceRoot, tokens);
    const sourceXlf = await fs.promises.readFile(
      path.resolve(process.cwd(), 'tools/generate-xlf/tests/assets/messages.source.xlf')
    );

    // Should get the file
    expect(sourceXlf).toBeTruthy();

    console.log(sourceXlf.toString());

    // Known good state
    const x = `
    <?xml version="1.0" encoding="UTF-8"?>
      <xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
        <file source-language="en" datatype="plaintext" original="generate-xlf">
          <body>
            <trans-unit id="1" datatype="html"><source>Hello World!</source></trans-unit>
            <trans-unit id="2" datatype="html"><source>This is a {variable} and {another}</source></trans-unit>
            <trans-unit id="3" datatype="html"><source>_*One*_ & two; three four! __Punctuation__ on the floor...</source></trans-unit>
            <trans-unit id="4" datatype="html"><source>File type {inputElement.files[0].type} not allowed</source></trans-unit>
            <trans-unit id="not_missing" datatype="html"><source>Placeholder for missing-tokens.ts test</source></trans-unit>
        </body>
        </file>
      </xliff>
    `;

    // Ignore all whitespacing/tabs
    expect(sourceXlf.toString().replace(/\s+/g, '')).toEqual(x.replace(/\s+/g, ''));
  });

  // // await s(writeXliffMergeConfig(sourcePath, locales), 'Generating config file for xliff-merge');
  it('Should generate the config file for xliff-merge', async () => {
    await writeXliffMergeConfig(project.sourceRoot, project.i18n.locales);
    const mergeConfigFile = await fs.promises.readFile(
      path.resolve(process.cwd(), 'tools/generate-xlf/tests/assets/xliffmerge.config.json')
    );

    expect(mergeConfigFile).toBeTruthy();

    const mergeConfig = JSON.parse(mergeConfigFile.toString());
    expect(mergeConfig.xliffmergeOptions.languages).toEqual(expect.arrayContaining(project.i18n.locales));
  });

  // await s(writeLocaleXlfFiles(sourcePath), 'Merging old locale .xlf files with new tokens');
  it('Should merge old locale .xlf files with new tokens', async () => {
    await writeLocaleXlfFiles(project.sourceRoot);

    const mergedXliffs = await Promise.all(
      project.i18n.locales.map(locale =>
        fs.promises.readFile(path.resolve(process.cwd(), `tools/generate-xlf/tests/assets/messages.${locale}.xlf`))
      )
    );

    // Should be as many xlfs as there are locales
    expect(mergedXliffs).toHaveLength(project.i18n.locales.length);
    mergedXliffs.forEach(xlf => expect(xlf).toBeTruthy());
  });

  // await s(cleanupXlfGeneration(sourcePath), 'Cleanup config/source files for .xlf generation');
  it('Should cleanup config/source files for .xlf generation', async () => {
    await cleanupXlfGeneration(project.sourceRoot);

    // Should've deleted these setup files
    expect(fs.existsSync(path.resolve(process.cwd(), 'tools/generate-xlf/tests/assets/xliffmerge.config.json'))).toBe(
      false
    );
    expect(fs.existsSync(path.resolve(process.cwd(), 'tools/generate-xlf/tests/assets/messages.source.xlf'))).toBe(
      false
    );
  });

  // await s(writeICUVarTypesFile(sourcePath, tokens), 'Create a types file for all ICU expressions & their variables');
  it('Should create a types file for all the ICU expressions & their variables', async () => {
    await writeICUVarTypesFile(project.sourceRoot, tokens);
    const typesFile = await fs.promises.readFile(
      path.resolve(process.cwd(), `tools/generate-xlf/tests/assets/i18n-tokens.autogen.ts`)
    );

    const lines = typesFile.toString().split('\n');

    expect(lines.find(l => l.includes('@@1'))).toContain('never');
    expect(lines.find(l => l.includes('@@2'))).toContain('"variable" | "another"');
    expect(lines.find(l => l.includes('@@3'))).toContain('never');
    expect(lines.find(l => l.includes('@@4'))).toContain('"inputElement.files[0].type"');
  });

  it('Should translate tokens using Google Translate API', async () => {
    const Translator = new Translate.v2.Translate({
      projectId: process.env.GCP_PROJECT_ID
    });

    let t = { ...tokens, '5': 'Invoice Number: <span class="opacity-50">#{{ invoice.data.invoice_id }}</span>' };

    const translations = {
      nb: {
        ['1']: 'Hei Verden!',
        ['2']: 'Dette er en {variable} og {another}',
        ['3']: '_*En to*_; tre fire! __Punctuation__ på gulvet...',
        ['4']: 'Filtype {inputElement.files[0].type} ikke tillatt',
        ['5']: 'Fakturanummer: <span class="opacity-50">#{{ invoice.data.invoice_id }}</span>'
      },
      cy: {
        ['1']: 'Helo Byd!',
        ['2']: '{variable} a {another} yw hwn',
        ['3']: '_*Un*_ & dau; tri phedwar! __Punctuation__ ar y llawr...',
        ['4']: 'Ni chaniateir math o ffeil {inputElement.files[0].type}',
        ['5']: 'Rhif yr Anfoneb: <span class="opacity-50">#{{ invoice.data.invoice_id }}</span>'
      }
    };

    for await (const locale of Object.keys(translations)) {
      for await (const index of Object.keys(translations[locale])) {
        expect(await translateICUString(t[index], locale, Translator)).toEqual(translations[locale][index]);
      }
    }
  });
});
