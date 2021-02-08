import { writeFile } from 'fs';
const targetPath = './src/environments/environment.ts';
const colors = require('colors');
require('dotenv').load();

// `environment.ts` file structure
let envConfigFile = `
export const environment = {
   frontendUrl: '${process.env.API_BASE_URL}',
   apiUrl: '${process.env.API_URL}',
   environment: '${process.env.NG_ENV}',
};
`;

if(process.env.NG_ENV == "development") envConfigFile += `import 'zone.js/dist/zone-error';`

console.log(colors.magenta('The file `environment.ts` will be written with the following content: \n'));
console.log(colors.grey(envConfigFile));

writeFile(targetPath, envConfigFile, function (err) {
  if (err) {
    throw console.error(err);
  } else {
    console.log(colors.magenta(`Angular environment.ts file generated correctly at ${targetPath} \n`));
  }
});
