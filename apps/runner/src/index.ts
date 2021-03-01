import * as rax from 'retry-axios';
import { Auth, Register, Router } from '@core/shared/api';

import Env from './env';
import routes from './routes';
import providers, { RunnerDataClient } from './common/data';
import { log, stream } from './common/logger';
import Queues from './common/queues';
import { setQueues, BullMQAdapter, router } from 'bull-board';
import axios from 'axios';

export const api = axios.create({
  baseURL: Env.API_URL,
  withCredentials: true,
  auth: { username: 'service:runner', password: Env.INTERNAL_KEY },
});

rax.attach(api);

Register<RunnerDataClient>({
  name: 'Runner',
  providers: providers.create(),
  environment: Env.ENVIRONMENT,
  port: Env.EXPRESS_PORT,
  logger: log,
  stream: stream,
  endpoint: ''
})(async (app, client) => {
  try {
    try {
      await api.get(`/ping`, {
        raxConfig: {
          retry: 3,
          instance: api,
          noResponseRetries: 3,
          retryDelay: 1000,
          backoffType: 'static',
          onRetryAttempt: err => {
            log.warn(`API ping attempt (${rax.getConfig(err).currentRetryAttempt}/3)`);
          }
        }
      })
      log.http(`Recieved response from API`);
    } catch (error) {
      log.error(`Recieved no response from API`);
      process.exit(0);      
    }

    const queues = Queues.create(client);
    app.on('close', () => Queues.close(queues));

    // Setup bull-board UI 
    setQueues(Object.values(queues).map(q => new BullMQAdapter(q.queue)));
    app.use('/admin/queues', router);

    return Router(client, Auth.none, { redis: client.connections.redis }, log)(routes(queues));
  } catch (error) {
    console.log(error);
  }
});
