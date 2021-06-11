import inquirer from 'inquirer';
const spawn = require('child_process').spawn;

const logo = `
\`...-\/\/\/\/\/\/\/:..\/\/\/\/\/\/\/:-.\`
......-:\/+++-...::----::\/+\/:\`
\/-...------:\`\`            .\/+\/.
\/+--------.       \`.\`\`    .\/ooo\/.
\/++:------     \`..-\/+++:.\/oooooo+-
\/+++:----.     ....-:\/\/++ooooooooo-
\/++++:--:.     \`.----:\/\/\/\/+++oooooo.
\/+++++::::\`       \`\`.-:\/\/\/\/\/\/++oooo\/
\/++++++\/::-.\`          \`.:\/\/\/\/++oooo
\/+++++++\/:----..\`\`        .\/++++oooo
:++++++++:-----::::-.\`     \`++++oss\/
\`++++++++\/::::::::::::-     \/+++oss.
 -+++++++\/\/:.:::::::::-     ++++ss\/      StageUp Core v${process.env.npm_package_version}
  -+++++\/\/.  \`.-::::-.     -++oos\/       https://github.com/StageUp/core
   .\/+++\/\`                -++oso-
     -+o++:-\`         \`.-\/+oso:
       .:+++++\/\/\/:::\/\/++oso\/-
          \`.::\/+++++++\/:-\`

`;

console.clear();
console.log(logo);

const applications: {
  [application: string]: {
    environments: string[];
    locales?: string[];
    cmd: { [action: string]: (env: string, locale?: string) => string };
  };
} = {
  backend: {
    cmd: {
      serve: env => `cross-env NODE_ENV=${env} nx serve backend --configuration=${env}`,
      build: env => `cross-env NODE_ENV=${env} nx build backend --configuration=${env} --generatePackageJson`
    },
    environments: ['development', 'testing', 'staging', 'production']
  },
  frontend: {
    cmd: {
      // FIXME: use configuration composition https://github.com/nrwl/nx/issues/2839
      // https://ngrefs.com/latest/cli/builder-browser#localize
      // Pass locale to process.env for set-env.ts to add
      serve: (env, locale) =>
        `cross-env LOCALE=${locale} ${applications.frontend.cmd['set-env'](
          env
        )} && nx serve frontend --configuration=${env}`,
      build: (env, locale) =>
        `cross-env LOCALE=${locale} ${applications.frontend.cmd['set-env'](
          env
        )} && nx build frontend --configuration=${env}`,
      ['extract-i18n']: () => `nx run frontend:extract-i18n && nx run frontend:xliffmerge`,
      ['set-env']: env => `ts-node ./apps/frontend/set-env.ts --env=${env}`
    },
    environments: ['development', 'staging', 'production'],
    locales: ['en', 'nb', 'cy']
  },
  ['api-tests']: {
    cmd: {
      execute: env => `nx test api-tests --watch`
    },
    environments: ['development', 'staging', 'production']
  },
  deploy: {
    cmd: {
      build: env =>
        `npm run xlf-missing && npm run generate:xlf && ${applications.frontend.cmd['set-env'](
          env
        )} && nx affected:build --all --parallel --configuration=${env}`
    },
    environments: ['staging', 'production']
  },
  seeder: {
    cmd: {
      seed: () => `nx run seeder:start`
    },
    environments: ['development', 'staging', 'production']
  }
};

(async () => {
  const app = await inquirer.prompt([
    { type: 'list', name: 'value', message: 'Select application', choices: [...Object.keys(applications)] }
  ]);

  const select = async app => {
    const action = await inquirer.prompt({
      type: 'list',
      name: 'value',
      message: 'Run action',
      choices: Object.keys(applications[app].cmd)
    });

    const env = await inquirer.prompt([
      {
        type: 'list',
        name: 'value',
        message: 'Select environment',
        choices: applications[app].environments
      }
    ]);

    const locale = await (async () => {
      if (app == 'frontend' && (action.value == 'serve' || action.value == 'build')) {
        const locale = await inquirer.prompt([
          { type: 'list', name: 'value', message: 'Select locale', choices: applications.frontend.locales }
        ]);
        return locale;
      }
    })();

    return [action.value, env.value, locale?.value];
  };

  const apps = [app.value];

  const commands = [];
  for (let i = 0; i < apps.length; i++) {
    const [action, env, locale] = await select(apps[i]);
    commands.push(applications[apps[i]].cmd[action](env, locale).split(' '));
  }

  console.clear();
  commands.forEach((command, idx) => {
    spawn(command.shift(), command, { shell: true, stdio: 'inherit' });
  });
})();
