import inquirer from 'inquirer';
const spawn = require('child_process').spawn;

const logo = `
             \`.-:\/+osy+  
           mMMMMMNMMMMN  
           hMMMh-.:mMMM- 
           +MMMy.\`.dMMMo 
           .MMMMNmMMMMMd 
            mMMMMMMMMMMM 
 .--:\/+osyhdNMMMMMMMMMMm 
\`NMMMMNmNMMNdysssyhmMMM+ 
 dMMMs.\`-dy-\` .--.\`.yMs  
 +MMMh:-:m\`  :mMNNmhd\/   
 .MMMMMNMMo\`  -\/oyh\/\`    
  dMMMMMMMMmy+:-\`        
  \/MMMMMMMMMMMMNm+       
   oMMMMMm\/-+yhhs-       StageUp Core v${process.env.npm_package_version}
    :dMMMNs\/-.\`          https://github.com/StageUp/core
      :yNMMMMNN+         
         .\/osyy+     
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
      serve: (env, locale) =>
        `${applications['frontend:set-env'].cmd.execute(env)} && nx serve frontend --configuration=${env}`,
      build: (env, locale) =>
        `${applications['frontend:set-env'].cmd.execute(env)} && nx build frontend --configuration=${env}`,
      ['extract-i18n']: env => `nx run frontend:extract-i18n && nx run frontend:xliffmerge`
    },
    environments: ['development', 'staging', 'production'],
    locales: ['en', 'no']
  },
  runner: {
    environments: ['development', 'staging', 'production'],
    cmd: {
      serve: env => `cross-env NODE_ENV=${env} nx serve runner --configuration=${env}`,
      build: env => `cross-env NODE_ENV=${env} nx build runner --configuration=${env} --generatePackageJson`
    }
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
        `${applications['frontend:set-env'].cmd.execute(
          env
        )} && nx run-many --all --target=build --parallel --configuration=${env}`
    },
    environments: ['staging', 'production']
  },
  ['frontend:set-env']: {
    cmd: {
      execute: env => `ts-node ./apps/frontend/set-env.ts --env=${env}`
    },
    environments: ['development', 'staging', 'production']
  }
};

(async () => {
  const app = await inquirer.prompt([
    { type: 'list', name: 'value', message: 'Select application', choices: Object.keys(applications) }
  ]);

  const action = await inquirer.prompt({
    type: 'list',
    name: 'value',
    message: 'Run action',
    choices: Object.keys(applications[app.value].cmd)
  });

  
  const env = await inquirer.prompt([
    {
      type: 'list',
      name: 'value',
      message: 'Select environment',
      choices: applications[app['value']].environments
    }
  ]);

  const locale = await (async () => {
    if (app.value == 'frontend') {
      const locale = await inquirer.prompt([
        { type: 'list', name: 'value', message: 'Select locale', choices: applications.frontend.locales }
      ]);
      return locale;
    }
  })();

  const commands: string[] = (() => {
    if (app.value == 'frontend') {
      return applications.frontend.cmd[action.value](env.value, locale.value);
    } else {
      return applications[app.value].cmd[action.value](env.value);
    }
  })().split(' ');

  // console.clear();
  console.log('\n', commands, '\n');

  spawn(commands.shift(), commands, { shell: true, stdio: 'inherit' });
})();
