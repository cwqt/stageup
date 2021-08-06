require('dotenv').config();
import * as fs from 'fs';
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
  fixCharacterEntityProblems,
  convertMarkdownTokensToHtml
} from './methods';
import colors = require('colors');
import yargs = require('yargs');

if (!process.env.GCP_PROJECT_ID) console.log('Missing .env variable GCP_PROJECT_ID'.red), process.exit(1);
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS)
  console.log('Missing .env variable GOOGLE_APPLICATION_CREDENTIALS'.red), process.exit(1);

(async () => {
  // npm run generate:xlf --project="some_project"
  const project = yargs.argv['project'] as string;
  const workspace: { [index: string]: WorkspaceProject } = JSON.parse(
    (await fs.promises.readFile(path.resolve(process.cwd(), 'workspace.json'))).toString()
  );

  const generate = async (project: WorkspaceProject) => {
    // For projects with a "i18n.sources" entry, collate all listed .hjson i18n token files & generate .xlfs for each locale
    // Angular handles the i18n differently by using @angular-devkit/build-angular:extract-i18n & @ngx-i18nsupport/tooling:xliffmerge
    // But we can still this tool to translate any new trans-units as a first-pass
    if (!project.i18n?.path) console.log('Missing i18n entry in workspace project'), process.exit(1);

    const { sourceRoot } = project;
    const { path: sourcePath } = project.i18n;
    const locales = (Array.isArray(project.i18n.locales)
      ? project.i18n.locales
      : Object.keys(project.i18n.locales)
    ).sort((a, b) => (a > b ? 1 : -1));

    console.log(`Generating xlf's for ${project.prefix.bold} with locales: ${colors.bold(locales.join(', '))}`);

    // prettier-ignore
    if (project.i18n.sources) { // only apps with .yaml files
      let tokens = await s(extractTokensFromSources(project.i18n.sources), 'Extracting i18n tokens from .yaml files');
      await s(findMissingTokens(sourceRoot, tokens),                       'Checking for missing tokens in the code');
      tokens = await s(convertMarkdownTokensToHtml(tokens),                'Convert markdown tokens to HTML')
      await s(writeSourceXlfFile(sourcePath, tokens),                      'Writing a source .xlf translation file');
      await s(writeXliffMergeConfig(sourcePath, locales),                  'Generating config file for xliff-merge');
      await s(writeLocaleXlfFiles(sourcePath),                             'Merging old locale .xlf files with new tokens');
      await s(cleanupXlfGeneration(sourcePath),                            'Cleanup config/source files for .xlf generation');
      await s(writeICUVarTypesFile(sourcePath, tokens),                    'Create a types file for all ICU expressions & their variables');
    }

    await translateUntranslatedTransUnits(project.i18n.path, locales);
    await s(fixCharacterEntityProblems(sourcePath), 'Fixing broken character entities & translation mistakes');
  };

  // Generate all if non provided, as is the case with npm run generate:xlf
  if (project) {
    await generate(workspace.projects[project]);
  } else {
    for await (let project of Object.keys(workspace.projects).filter(
      project => workspace.projects[project]?.i18n?.path
    )) {
      await generate(workspace.projects[project]);
    }
  }
})();
