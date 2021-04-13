import { LiveStreamState, SseEventType } from '@core/interfaces';
import { AsyncRouter, Auth, ProviderMap, Providers, Register, Router, TopicType } from '@core/shared/api';
import { timeout, uuid } from '@core/shared/helpers';
import sse, { ISseMiddlewareOptions, ISseResponse } from '@toverux/expresse';
import { compose } from 'compose-middleware';
import { Handler, NextFunction, Request } from 'express';
import { HubManager } from './common/hub-mananger';
import { log, stream } from './common/logger';
import Env from './env';

export interface NotificationsProviderMap extends ProviderMap {
  pubsub: InstanceType<typeof Providers.PubSub>;
}

Register<NotificationsProviderMap>({
  name: `notifs-${uuid()}`,
  environment: Env.ENVIRONMENT,
  port: Env.EXPRESS_PORT,
  logger: log,
  stream: stream,
  endpoint: Env.ENDPOINT,
  provider_map: {
    pubsub: new Providers.PubSub(
      {
        project_id: Env.PUB_SUB.project_id,
        port: Env.PUB_SUB.port
      },
      log
    )
  }
})(async (app, pm, config) => {
  // FIXME: Backend deletes & re-creates topics on every development change, but in production
  // all the topics are created in advance - wait here so we don't have a race condition where we
  // make a subscription on a topic, which then gets deleted and the whole system dies as a result
  await timeout(1000);

  // Track connections with clients for SSE
  const hubs = new HubManager(log);

  // Create dynamic subscription on StreamState topic for each instance of this server
  await pm.pubsub.subscribe(
    TopicType.StreamStateChanged,
    `${TopicType.StreamStateChanged}-sse-${config.name.split('-').pop()}`,
    ({ data, msg }) => {
      // No connected clients on this instance
      if (!hubs.get(data.performance_id)) {
        log.debug(`No clients on this instance for pid ${data.performance_id}`);
        return msg.ack();
      }

      // Submit the event to all connected clients on the hub
      hubs.emit(data.performance_id, { type: SseEventType.StreamStateChanged, data: data.state });

      // Handle transmitting the state to all clients & closing the hub if stream complete
      if (data.state == LiveStreamState.Completed) hubs.destroy(data.performance_id);

      log.debug('Active hubs: %o', hubs.getTotalClientCount());
      msg.ack();
    }
  );

  /**
   * @description SSE middleware that configures an Express response for an SSE session, installs `sse.*` functions on the Response object
   */
  function dynamicSseHub(options: Partial<ISseMiddlewareOptions> = {}): Handler {
    function middleware(req: Request, res: ISseResponse, next: NextFunction): void {
      if (!hubs.get(req.params.pid)) hubs.create(req.params.pid);
      const hub = hubs.get(req.params.pid);

      // Register the SSE functions of that client on the hub
      hub.register(res.sse);

      // Unregister the user from the hub when its connection gets closed (close=client, finish=server)
      res.once('close', () => hub.unregister(res.sse));
      res.once('finish', () => hub.unregister(res.sse));

      next();
    }

    return compose(sse(options), middleware);
  }

  return Router(
    pm,
    Auth.none,
    { redis: null },
    log
  )((router: AsyncRouter<NotificationsProviderMap>) => {
    router.raw<void>('/performances/:pid', {
      authStrategy: Auth.none,
      preMiddlewares: [dynamicSseHub()],
      // Handler keeps connection alive - up until the client destroys the connection or we end it
      handler: (res: ISseResponse) => res.sse.data({ type: SseEventType.Connected }),
      controller: async req => {}
    });
  });
});
