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
  translateICUString,
  convertMarkdownTokensToHtml,
  fixCharacterEntityProblems
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

  afterAll(async () => {
    const cleanup = ['messages.cy.xlf', 'messages.en.xlf', 'messages.nb.xlf', 'i18n-tokens.autogen.ts'];
    await Promise.allSettled(
      cleanup.map(
        f => new Promise(res => fs.unlink(path.resolve(process.cwd(), 'tools/generate-xlf/tests/assets/', f), res))
      )
    );
  });

  it('Should have the test workspace file with all locales & correct paths', async () => {
    expect(project.root).toEqual('tools/generate-xlf/tests');
    expect(project.i18n.locales).toEqual(expect.arrayContaining(['en', 'nb', 'cy']));
    expect(project.i18n.sources[0]).toEqual('tools/generate-xlf/tests/assets/i18.test.yaml');
    expect(project.i18n.path).toEqual('tools/generate-xlf/tests/assets/i18n');
  });

  // const tokens = await s(extractTokensFromSources(project.i18n.sources), 'Extracting i18n tokens from .yaml files');
  it('Should extract i18n tokens from .yaml files', async () => {
    const t = await extractTokensFromSources(project.i18n.sources);

    expect(t['1']).toEqual('Hello World!');
    expect(t['2']).toEqual('This is a {variable} & {another}');
    expect(t['3']).toEqual('_*Some CommonMark*_ formatting would be **great**... (tm)');
    expect(t['4']).toEqual('Link formats <{wow_a_var_link}> [another link]({url})');
    expect(t['nested.object.token']).toEqual('Here I am!');

    expect(t['multiline']).not.toEqual(undefined);

    expect(t['angular']).toEqual('File type <x id="PH" equiv-text="inputElement.files[0].type"/> not allowed');

    tokens = t; // make global for next test
  });

  // await s(findMissingTokens(tokens), 'Checking for missing tokens in the code');
  it('Should check for missing tokens in the code', async () => {
    const missing = await findMissingTokens(project.sourceRoot, tokens);
    expect(missing.has('should_be_missing')).toBe(true);
    expect(missing.has('not_missing')).toBe(false);
  });

  // tokens = await s(convertMarkdownTokensToHtml(tokens),                'Convert markdown tokens to HTML')
  it('Should convert all markdown tokens to HTML', async () => {
    const t = await convertMarkdownTokensToHtml(tokens);

    expect(t['1']).toEqual('Hello World!');
    expect(t['2']).toEqual('This is a {variable} &amp; {another}');
    // amp; is bad!,
    expect(t['3']).toEqual('<em><em>Some CommonMark</em></em> formatting would be <strong>great</strong>… ™');
    expect(t['4']).toEqual(
      'Link formats <a href="{wow_a_var_link}">{wow_a_var_link}</a> <a href="{url}">another link</a>'
    );

    t.angular = tokens.angular; // don't convert angular token

    tokens = t; // make global for next test
  });

  // await s(writeSourceXlfFile(sourcePath, tokens), 'Writing a source .xlf translation file');
  it('Should write a source .xlf translation file', async () => {
    await writeSourceXlfFile(project.sourceRoot, tokens);
    const sourceXlf = await fs.promises.readFile(
      path.resolve(process.cwd(), 'tools/generate-xlf/tests/assets/messages.source.xlf')
    );

    // Should get the file
    expect(sourceXlf).toBeTruthy();

    // Known good state
    const x = `
    <?xml version="1.0" encoding="UTF-8"?>
    <xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
      <file source-language="en" datatype="plaintext" original="generate-xlf">
        <body>
          <trans-unit id="1" datatype="html"><source>Hello World!</source></trans-unit>
          <trans-unit id="2" datatype="html"><source>This is a {variable} &amp; {another}</source></trans-unit>
          <trans-unit id="3" datatype="html"><source><em><em>Some CommonMark</em></em> formatting would be <strong>great</strong>… ™</source></trans-unit>
          <trans-unit id="4" datatype="html"><source>Link formats <a href="{wow_a_var_link}">{wow_a_var_link}</a> <a href="{url}">another link</a></source></trans-unit>
          <trans-unit id="nested.object.token" datatype="html"><source>Here I am!</source></trans-unit>
          <trans-unit id="multiline" datatype="html"><source><p>@{user_username} ({user_email_address}) has requested a refund on their purchase of {performance_name}</p>
  <ul>
  <li><strong>Invoice #:</strong> {invoice_id}</li>
  <li><strong>Performance:</strong> {performance_name}</li>
  <li><strong>Purchased On:</strong> {purchase_date}</li>
  <li><strong>Amount:</strong> {amount}</li>
  </ul>
  </source></trans-unit>
          <trans-unit id="angular" datatype="html"><source>File type <x id="PH" equiv-text="inputElement.files[0].type"/> not allowed</source></trans-unit>
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
    expect(lines.find(l => l.includes('@@4'))).toContain('"url"');
  });

  it('Should translate tokens using Google Translate API', async () => {
    const Translator = new Translate.v2.Translate({
      projectId: process.env.GCP_PROJECT_ID
    });

    let t = { ...tokens, '5': 'Invoice Number: <span class="opacity-50">#{{ invoice.data.invoice_id }}</span>' };

    const translations = {
      nb: {
        ['1']: 'Hei Verden!',
        ['2']: 'Dette er en {variable} & amp; {another}',
        ['3']: '<em><em>Noen CommonMark-</em></em> formatering vil være <strong>bra</strong> … ™',
        ['4']: '<a href="{wow_a_var_link}">Linkformater {wow_a_var_link}</a> <a href="{url}">en annen link</a>',
        ['5']: 'Fakturanummer: <span class="opacity-50"># {{ invoice.data.invoice_id }}</span>',
        ['angular']: 'Filtype <x id="PH" equiv-text="inputElement.files[0].type"/> ikke tillatt'
      },
      cy: {
        ['1']: 'Helo Byd!',
        ['2']: '{variable} & amp yw hwn; {another}',
        ['3']: '<em><em>Byddai rhywfaint o</em></em> fformatio <strong>CommonMark yn wych</strong> … ™',
        ['4']: 'Fformatau <a href="{wow_a_var_link}">cyswllt {wow_a_var_link}</a> <a href="{url}">dolen arall</a>',
        ['5']: 'Rhif yr Anfoneb: <span class="opacity-50"># {{ invoice.data.invoice_id }}</span>',
        ['angular']: 'Ni chaniateir math o ffeil <x id="PH" equiv-text="inputElement.files[0].type"/>'
      }
    };

    for await (const locale of Object.keys(translations)) {
      for await (const index of Object.keys(translations[locale])) {
        expect(await translateICUString(t[index], locale, Translator)).toEqual(translations[locale][index]);
      }
    }
  });

  // await s(fixCharacterEntityProblems(sourcePath), 'Fixing broken character entities & translation mistakes');
  it('Should fix broken character entities & translations mistakes', async () => {
    const bodies = await fixCharacterEntityProblems(project.sourceRoot);
  });
});
