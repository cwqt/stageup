// import { AsyncRouter, IControllerEndpoint, Providers } from '@core/api';
// import { AsyncRouterInstance } from 'express-async-router';

// export interface Module {
//   name: string;
//   controller?: { [index: string]: IControllerEndpoint };
//   register: (bus: InstanceType<typeof Providers.EventBus>, ...args) => Promise<Module>;
// }

import { AsyncRouter, IControllerEndpoint, Providers } from '@core/api';
import { AsyncRouterInstance } from 'express-async-router';

export interface Module {
  name: string;
  routes?: { [index: string]: IControllerEndpoint };
  register: (bus: InstanceType<typeof Providers.EventBus>, ...args) => Promise<Module>;
}
