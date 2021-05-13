import { AsyncRouter, Providers } from '@core/api';
import { AsyncRouterInstance } from 'express-async-router';

export interface Module {
  name: string;
  register: (bus: InstanceType<typeof Providers.EventBus>, ...args) => Promise<AsyncRouterInstance | void>;
}
