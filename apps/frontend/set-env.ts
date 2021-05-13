import { argv } from 'yargs';
import { writeFile, existsSync, unlinkSync } from 'fs';
import colors = require('colors');
require('dotenv-flow').config({ node_env: argv['env'] });

const environment = argv['env'];
const targetPath = `${__dirname}/src/environments/environment.${environment}.ts`;

// `environment.ts` file structure
let envConfigFile = '';
if (environment == 'development' || environment == 'testing') envConfigFile += `import 'zone.js/dist/zone-error';\n`;

envConfigFile += `export const environment = {
   apiUrl: '${process.env.EXTERNAL_URL}:3000',
   sseUrl: '${process.env.EXTERNAL_URL}:3000/sse',
   frontendUrl: '${process.env.EXTERNAL_URL}:4200',
   environment: '${environment}',
   stripePublicKey: '${process.env.STRIPE_PUBLIC_KEY}',
   appVersion: '${process.env.npm_package_version}'
};
`;

console.log(colors.magenta(`The file 'environment.${environment}.ts' will be written with the following content:\n`));
console.log(colors.grey(envConfigFile));

// Remove file if already exists
if (existsSync(targetPath)) unlinkSync(targetPath);

writeFile(targetPath, envConfigFile, { flag: 'wx' }, err => {
  if (err) throw err;
});
