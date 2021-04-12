import { Attributes, PubSub, Subscription, Message } from '@google-cloud/pubsub';
import { Logger } from 'winston';
import { Observable, Subscription as RxSubscription } from 'rxjs';

export interface IPubSubProviderConfig {
  project_id: string;
  port: number;
  topic_name?: string;
  subscription_name?: string;
}

import { ProviderMap, Provider } from '../';
import { TopicType, TopicDataUnion } from '../../pubsub';

export type MessageHandlerData<T extends TopicType> = { data: TopicDataUnion[T]; msg: Message };

export default class PubSubProvider implements Provider<PubSub> {
  name = 'PubSub';
  connection: PubSub;
  config: IPubSubProviderConfig;
  log: Logger;

  constructor(config: IPubSubProviderConfig, log: Logger) {
    this.config = config;
    this.log = log;
  }

  async connect(providerMap: ProviderMap) {
    this.connection = new PubSub({ projectId: this.config.project_id, port: this.config.port });

    return this.connection;
  }

  async publish<T extends TopicType>(topic: T, data: TopicDataUnion[T], attr?: Attributes) {
    this.log.debug(`Published %o to ${topic}`, data);
    return this.connection.topic(topic).publishJSON(data, attr || {});
  }

  async disconnect() {
    await this.connection.close();
  }

  async subscribe<T extends TopicType>(
    topic: T,
    subscription: string,
    handler: (packet: MessageHandlerData<T>) => void
  ): Promise<RxSubscription> {
    const sub = (await this.connection.createSubscription(topic, subscription))[0];
    this.log.debug(`Created subscription ${subscription} to topic ${topic}`);

    return new Observable<MessageHandlerData<T>>(subscriber => {
      sub.on('message', (msg: Message) => {
        this.log.debug(`Recieved message ${msg.id}, attempt ${msg.deliveryAttempt}`);
        subscriber.next({ data: JSON.parse(msg.data.toString()), msg: msg });
      });
    }).subscribe(handler);
  }

  async drop() {}
}
