import { Environment, IFrontendEnvironment } from '@core/interfaces';

export const environment:IFrontendEnvironment = {
  environment: Environment.Development,
  apiUrl: 'http://localhost:3000',
  sseUrl: "http://localhost:3002",
  frontendUrl: 'http://localhost:4200',
  stripePublicKey: "",
  appVersion: ""
};

import 'zone.js/dist/zone-error';  // Included with Angular CLI.
