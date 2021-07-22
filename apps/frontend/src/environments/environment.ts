import { Environment, IFrontendEnvironment } from '@core/interfaces';

export const environment: IFrontendEnvironment = {
  environment: Environment.Development,
  is_deployed: true,
  frontend_url: 'http://localhost:4200',
  stripe_public_key: '',
  app_version: '',
  mux_env_key: ''
};

import 'zone.js/dist/zone-error'; // Included with Angular CLI.
