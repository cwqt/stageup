import dedent from 'dedent';
import inquirer from 'inquirer';
import { argv } from 'yargs';
import colors = require('colors');
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

// console.clear();
console.log(logo);

const isDeployed = argv?.['is-deployed'] || false;

const SUPPORTED_LOCALES = ['en', 'nb', 'cy'];

const applications: {
  [application: string]: {
    environments: string[];
    locales?: string[];
    hide?: boolean;
    cmd: { [action: string]: (env: string, locale?: string) => string };
  };
} = {
  backend: {
    cmd: {
      serve: env => `cross-env NODE_ENV=${env} npx nx serve backend --configuration=${env}`,
      build: env => `cross-env NODE_ENV=${env} npx nx build backend --configuration=${env} --generatePackageJson`
    },
    environments: ['development', 'testing', 'staging', 'production']
  },
  frontend: {
    cmd: {
      // FIXME: use configuration composition https://github.com/nrwl/nx/issues/2839
      // https://ngrefs.com/latest/cli/builder-browser#localize
      // Pass locale to process.env for set-env.ts to add
      serve: env => `${applications.frontend.cmd['set-env'](env)} && npx nx serve frontend --configuration=${env}`,
      build: env => `${applications.frontend.cmd['set-env'](env)} && npx nx build frontend --configuration=${env}`,
      ['set-env']: env => `npx ts-node ./apps/frontend/set-env.ts --env=${env} ${isDeployed ? '--is-deployed' : ''}`
    },
    environments: ['development', 'staging', 'production'],
    locales: SUPPORTED_LOCALES
  },
  ['api-tests']: {
    cmd: {
      execute: env => `npx nx test api-tests --watch`
    },
    environments: ['development', 'staging', 'production']
  }
};

(async () => {
  // Command line interfacing
  // e.g. npm run start deploy:build:production --base=$(git rev-parse HEAD)
  const args = (argv?.['_']?.pop() as string)?.split(':');
  const isDeployed = argv?.['is-deployed'];

  if (args?.length) {
    console.log(colors.gray('Running command:'), args);
    const project = args[0];
    if (!project) console.log(`No such project: ${project}`), process.exit(1);

    const action = args[1];
    if (!applications[project].cmd[action]) console.log(`No such command: ${action}`), process.exit(1);

    const env = args[2];
    if (!applications[project].environments.includes(env))
      console.log(`Project does not have env: ${env}`), process.exit(1);

    const locale = args[3];
    if (locale && !applications[project].locales?.includes(locale))
      console.log(`Project does not support locale: ${locale}`), process.exit(1);

    const command = applications[project].cmd[action](env, locale).split(' ');
    return spawn(command.shift(), command, { shell: true, stdio: 'inherit' });
  }

  // GUI interfacing
  const app = await inquirer.prompt([
    {
      type: 'list',
      name: 'value',
      message: 'Select application',
      choices: [...Object.keys(applications).filter(a => !applications[a].hide)]
    }
  ]);

  const select = async app => {
    const action = await inquirer.prompt({
      type: 'list',
      name: 'value',
      message: 'Run action',
      choices: Object.keys(applications[app].cmd)
    });

    let env = { value: applications[app].environments[0] };
    if (applications[app].environments.length > 1) {
      env = await inquirer.prompt([
        {
          type: 'list',
          name: 'value',
          message: 'Select environment',
          choices: applications[app].environments
        }
      ]);
    }

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

  commands.forEach((command, idx) => {
    console.log(colors.gray('Running command:'), command);
    spawn(command.shift(), command, { shell: true, stdio: 'inherit' });
  });
})();
