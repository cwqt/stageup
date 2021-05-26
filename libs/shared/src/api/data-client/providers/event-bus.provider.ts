import { Logger } from 'winston';
import { Subscription as RxSubscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import Rxmq, { Channel } from 'rxmq';

export interface IEventBusConfig {}

import { Provider } from '../';
import { Contract, ContractMeta, Event, EventContract } from '../../event-bus/contracts';
import { timestamp, uuid } from '@core/helpers';
import { ILocale } from '@core/interfaces';

export default class EventBusProvider implements Provider<void> {
  name = 'EventBus';
  connection: void;
  config: IEventBusConfig;
  log: Logger;

  // don't expose the inner workings of this provider to everyone, since we may swap it out
  // for rabbitmq/gcp pubsub etc.
  private _connection: Channel<any>;

  constructor(config: IEventBusConfig, log: Logger) {
    this.config = config;
    this.log = log;
  }

  async connect() {
    this._connection = Rxmq.channel('__bus'); // single channel bus
    return this.connection;
  }

  async publish<T extends Event>(event: T, data: EventContract[T], locale: ILocale) {
    const meta: ContractMeta = {
      locale: locale,
      timestamp: timestamp(),
      uuid: uuid()
    };

    this.log.debug(`Published %o to ${event}`, data);
    return this._connection.subject(event).next({ ...data, __meta: meta });
  }

  async subscribe<T extends Event>(event: T, handler: (contract: Contract<T>) => void): Promise<RxSubscription> {
    return this._connection
      .subject(event)
      .pipe(
        tap((ct: Contract<T>) => {
          this.log.debug(`Recieved message ${ct.__meta.uuid} from ${event}`);
          return ct;
        })
      )
      .subscribe(handler);
  }

  async disconnect() {}
  async drop() {}
}
