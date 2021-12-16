import { LOGGING_PROVIDER } from '@core/api';
import { timestamp, uuid } from '@core/helpers';
import { ILocale } from '@core/interfaces';
import { Subscription as RxSubscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import Rxmq, { Channel } from 'rxmq';
import Container, { Token } from 'typedi';
import { Provider } from '../';
import { Contract, Event, EventContract } from '../../contracts';
import { Logger } from './logging.provider';

export interface EventBus {
  publish: (event: Event, contract: EventContract[Event], locale: ILocale) => Promise<void>;
  subscribe: (event: Event, handler: (ct: EventContract[Event]) => Promise<void>) => Promise<RxSubscription>;
}

export interface IRxmqEventBusConfig {}

// In future you'd want to replace this with GCP PubSub or RabbitMQ
// https://www.npmjs.com/package/rxmq
export class RxmqEventBus implements Provider<EventBus> {
  name = 'Rxmq Event Bus';
  connection: EventBus;
  config: IRxmqEventBusConfig;
  log: Logger;

  private channel: Channel<any>;

  constructor(config: IRxmqEventBusConfig) {
    this.config = config;
    this.log = Container.get(LOGGING_PROVIDER);
  }

  async connect() {
    this.channel = Rxmq.channel('__bus'); // single channel bus
    return this;
  }

  async publish<T extends Event>(event: T, data: EventContract[T], locale: ILocale) {
    const contract: Contract<T> = {
      ...data,
      __meta: {
        locale: locale,
        timestamp: timestamp(),
        uuid: uuid()
      }
    };

    this.log.debug(`Published %o to ${event}`, contract);
    return this.channel.subject(event).next(contract);
  }

  async subscribe<T extends Event>(event: T, handler: (contract: Contract<T>) => Promise<void>): Promise<RxSubscription> {
    const withCatch =
      (f: (ct: Contract<T>) => Promise<void>) =>
      ((ct: Contract<T>): void => {
        f(ct).catch(error => console.log(error));
      });

  return this.channel
    .subject(event)
    .pipe(
      tap((ct: Contract<T>) => {
        this.log.debug(`Recieved (${ct.__meta.uuid}) from ${event}`);
        return ct;
      })
    )
    .subscribe(
      withCatch(handler),
      err => console.error(err)
    );
  }

  async disconnect() {}
  async drop() {}
}
