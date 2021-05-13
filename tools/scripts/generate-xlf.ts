import * as fs from 'fs';
import Hjson from 'hjson';
import path from 'path';
import colors = require('colors');
import spawn from 'await-spawn';
import { exec } from 'child_process';

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
      console.log(colors.green.bold('Done!'));
    } else {
      console.log(colors.gray(`Skipping ${colors.bold(project)}, no 'path' in i18n`));
    }
  }
})();

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
