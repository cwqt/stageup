require('dotenv').config();
import * as fs from 'fs';
import ora from 'ora';
import path from 'path';
import { WorkspaceProject } from './interfaces';
import {
  s,
  extractTokensFromSources,
  findMissingTokens,
  translateUntranslatedTransUnits,
  writeICUVarTypesFile,
  writeLocaleXlfFiles,
  writeSourceXlfFile,
  writeXliffMergeConfig,
  cleanupXlfGeneration,
  executePrerunFunction,
  fixCharacterEntityProblems
} from './methods';
import colors = require('colors');

if (!process.env.GCP_PROJECT_ID) console.log('Missing .env variable GCP_PROJECT_ID'.red), process.exit(0);
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS)
  console.log('Missing .env variable GOOGLE_APPLICATION_CREDENTIALS'.red), process.exit(0);

(async () => {
  console.log(colors.bold('StageUp xlf Generator'), 'using ngx-i18nsupport & Hjson');
  const workspace = JSON.parse((await fs.promises.readFile(path.resolve(process.cwd(), 'workspace.json'))).toString());

  // For projects with a "i18n.sources" entry, collate all listed .hjson i18n token files & generate .xlfs for each locale
  // Angular handles the i18n differently by using @angular-devkit/build-angular:extract-i18n & @ngx-i18nsupport/tooling:xliffmerge
  // But we can still this tool to translate any new trans-units as a first-pass
  for await (let [project, data] of Object.entries<WorkspaceProject>(workspace.projects).filter(
    ([_, d]) => d.i18n?.path // Project must have an path entry
  )) {
    const locales = Array.isArray(data.i18n.locales) ? data.i18n.locales : Object.keys(data.i18n.locales);
    const { path } = data.i18n;

    console.log(`\n${project} with locales: ${colors.bold(locales.join(', '))}`);
    await executePrerunFunction?.(data.i18n.preRun);

    // prettier-ignore
    if (data.i18n.sources) {
        const tokens = await s(extractTokensFromSources(data.i18n.sources), 'Extracting i18n tokens from .hjson files');
        await s(findMissingTokens(tokens),                                  'Checking for missing tokens in the code');
        await s(writeSourceXlfFile(path, tokens),                           'Writing a source .xlf translation file');
        await s(writeXliffMergeConfig(path, locales),                       'Generating config file for xliff-merge');
        await s(writeLocaleXlfFiles(path),                                  'Merging old locale .xlf files with new tokens');
        await s(cleanupXlfGeneration(path),                                 'Cleanup config/source files for .xlf generation');
        await s(writeICUVarTypesFile(path, tokens),                         'Create a types file for all ICU expressions & their variables');
    }

    await s(fixCharacterEntityProblems(path), 'Fixing broken character entities');
    await translateUntranslatedTransUnits(data.i18n.path, locales);
  }
})();
