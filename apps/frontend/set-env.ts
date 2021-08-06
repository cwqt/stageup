import { argv } from 'yargs';
import { writeFile, existsSync, unlinkSync } from 'fs';
import colors = require('colors');
require('dotenv-flow').config({ node_env: argv['env'] });

const environment = argv['env'];
const targetPath = `${__dirname}/src/environments/environment.${environment}.ts`;

// `environment.ts` file structure
let envConfigFile = '';
if (environment == 'development' || environment == 'testing') envConfigFile += `import 'zone.js/dist/zone-error';\n`;

// Add extension in dev only for port re-directs
const extension = (url: string, port: number) =>
  `${url}${!url.includes('ngrok') && environment == 'development' ? `:${port}` : ''}`;

envConfigFile += `export const environment = {
  is_deployed: ${argv?.['is-deployed'] || false},
  app_version: '${process.env.npm_package_version}',
};
`;

// environment: '${environment}',
// frontend_url: '${extension(process.env.LOAD_BALANCER_URL, 4200)}',
// stripe_public_key: '${process.env.STRIPE_PUBLIC_KEY}',
// mux_env_key: '${process.env.MUX_ENV_KEY}',

console.log(colors.magenta(`The file 'environment.${environment}.ts' will be written with the following content:\n`));
console.log(colors.grey(envConfigFile));

// Remove file if already exists
if (existsSync(targetPath)) unlinkSync(targetPath);

writeFile(targetPath, envConfigFile, { flag: 'wx' }, err => {
  if (err) throw err;
});
