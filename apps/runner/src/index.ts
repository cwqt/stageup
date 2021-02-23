import { Auth, Register, Router } from '@core/shared/api';

import Env from './env';
import routes from './routes';
import providers, { RunnerDataClient } from './common/data';
import { log, stream } from './common/logger';
import Queues from './common/queues';
import { setQueues, BullMQAdapter, router } from 'bull-board'
import axios from 'axios';

export const api = axios.create({
  baseURL: Env.API_URL,
  withCredentials: true,
  auth: { username: "service", password: Env.INTERNAL_KEY }
});

Register<RunnerDataClient>({
  name: 'Runner',
  providers: providers.create(),
  environment: Env.ENVIRONMENT,
  port: Env.EXPRESS_PORT,
  logger: log,
  stream: stream
})(async (app, client) => {
  try {
    const queues = Queues.create();
    app.on('close', () => Queues.close(queues));

    setQueues(Object.values(queues).map(q => new BullMQAdapter(q.queue)));
    app.use('/admin/queues', router)

    api.get('/ping')

    return Router(client, Auth.none, { redis: client.connections.redis }, log)(routes(queues));      
  } catch (error) {
    console.log(error);
  }
});
