import { Module } from '@core/api';
import { FinanceEvents } from './finance/finance.events';
import { HostEvents } from './host/host.events';
import { MuxEvents } from './mux/mux.events';
import { MyselfEvents } from './myself/myself.events';
import { PerformanceEvents } from './performance/performance.events';
import { SSEEvents } from './sse/sse.events';
import { StripeEvents } from './stripe/stripe.events';
import { UserEvents } from './user/user.events';

export const modules: Module[] = [
  {
    name: 'Admin'
  },
  {
    name: 'Auth'
  },
  {
    name: 'Finance',
    events: FinanceEvents
  },
  {
    name: 'GDPR'
  },
  {
    name: 'Host',
    events: HostEvents
  },
  {
    name: 'MUX',
    events: MuxEvents
  },
  {
    name: 'Myself',
    events: MyselfEvents
  },
  // {
  //   name: "Patronage"
  // }
  {
    name: 'Performance',
    events: PerformanceEvents
  },
  {
    name: 'Job Queue'
  },
  {
    name: 'Stripe',
    events: StripeEvents
  },
  {
    name: 'Search'
  },
  {
    name: 'SSE',
    events: SSEEvents
  },
  {
    name: 'Users',
    events: UserEvents
  },
  {
    name: 'Utils'
  }
];
