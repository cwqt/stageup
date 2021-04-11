import { Auth, PG_MODELS, ProviderMap, Providers, Register, Router } from '@core/shared/api';
import axios from 'axios';
import { BullMQAdapter, router, setQueues } from 'bull-board';
import * as rax from 'retry-axios';
import { log, stream } from './common/logger';
import Queues from './common/queues';
import Env from './env';
import routes from './routes';


export const api = axios.create({
  baseURL: Env.API_URL,
  withCredentials: true,
  auth: { username: 'service:runner', password: Env.INTERNAL_KEY }
});

rax.attach(api);

export interface RunnerProviderMap extends ProviderMap {
  redis: InstanceType<typeof Providers.Redis>;
  sendgrid: InstanceType<typeof Providers.SendGrid>;
  torm: InstanceType<typeof Providers.Postgres>;
}

Register<RunnerProviderMap>({
  name: 'Runner',
  environment: Env.ENVIRONMENT,
  port: Env.EXPRESS_PORT,
  logger: log,
  stream: stream,
  endpoint: '',
  provider_map: {
    redis: new Providers.Redis({
      host: Env.REDIS.host,
      port: Env.REDIS.port
    }),
    torm: new Providers.Postgres(
      {
        host: Env.PG.host,
        port: Env.PG.port,
        username: Env.PG.username,
        password: Env.PG.password,
        database: Env.PG.database,
        // Runner should never resync database
        synchronize: false
      },
      PG_MODELS
    ),
    sendgrid: new Providers.SendGrid({
      username: Env.SENDGRID.username,
      api_key: Env.SENDGRID.api_key,
      enabled: Env.SENDGRID.enabled
    })
  }
})(async (app, pm) => {
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
      });
      log.http(`Recieved response from API`);
    } catch (error) {
      log.error(`Recieved no response from API`);
      process.exit(0);
    }

    const queues = Queues.create(pm);
    app.on('close', () => Queues.close(queues));

    // Setup bull-board UI
    // FIXME: https://github.com/felixmosh/bull-board/issues/120
    // setQueues(Object.values(queues).map(q => new BullMQAdapter(q.queue)));
    // app.use('/admin/queues', router);

    return Router(pm, Auth.none, { redis: pm.redis.connection }, log)(routes(queues));
  } catch (error) {
    console.log(error);
  }
});
