import { argv } from 'yargs';
import { writeFile, existsSync, unlinkSync } from 'fs';
import colors = require("colors");
require('dotenv-flow').config({ node_env: argv['env'] });

const environment = argv['env'];
const targetPath = `${__dirname}/src/environments/environment.${environment}.ts`;

// `environment.ts` file structure
let envConfigFile = '';
if (environment == 'development' || environment == 'testing') envConfigFile += `import 'zone.js/dist/zone-error';\n`;

envConfigFile += `export const environment = {
   apiUrl: '${process.env.API_URL}',
   frontendUrl: '${process.env.FE_URL}',
   environment: '${environment}',
   stripePublicKey: '${process.env.STRIPE_PUBLIC_KEY}'
};
`;

console.log(colors.magenta(`The file 'environment.${environment}.ts' will be written with the following content:\n`));
console.log(colors.grey(envConfigFile));

// Remove file if already exists
if(existsSync(targetPath)) unlinkSync(targetPath);

writeFile(targetPath, envConfigFile, { flag: 'wx' }, err => {
  if (err) throw err;
});
