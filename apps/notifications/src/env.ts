// https://stackoverflow.com/a/59805161/8526764
const TRUE_ENV = process.env['NODE' + '_ENV'];
/* eslint @typescript-eslint/no-var-requires: "off" */
require('dotenv-flow').config({ node_env: TRUE_ENV, silent: true });

import { Environment } from '@core/interfaces';
import { IPubSubProviderConfig } from '@core/shared/api';
import { isEnv } from '@core/shared/helpers';

interface IEnvironment {
  ENVIRONMENT: Environment;
  EXPRESS_PORT: number;
  ENDPOINT: string;
  PUB_SUB: IPubSubProviderConfig;
  isEnv: (env: Environment | Environment[]) => boolean;
}

const Env: IEnvironment = {
  isEnv: isEnv(TRUE_ENV as Environment),
  ENVIRONMENT: TRUE_ENV as Environment,
  ENDPOINT: process.env.SSE_ENDPOINT,
  EXPRESS_PORT: 3002,
  PUB_SUB: {
    project_id: process.env.PUB_SUB_PROJECT_ID,
    port: parseInt(process.env.PUB_SUB_PORT)
  },
};

export default Env;
