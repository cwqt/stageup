import { Logger } from 'winston';
import InfluxProvider from './providers/influx.provider';
import LocalTunnelProvider from './providers/localtunnel.provider';
import MuxProvider from './providers/mux.provider';
import PostgresProvider from './providers/postgres.provider';
import RedisProvider from './providers/redis.provider';
import StoreProvider from './providers/store.provider';
import SendGridProvider from './providers/sendgrid.provider';
import StripeProvider from './providers/stripe.provider';
import S3Provider from './providers/aws-s3.provider';
import SSEProvider from './providers/sse.provider';
import PubSubProvider from './providers/pub-sub.provider';

/**
 * DataClient: Object with methods for maintaining all providers
 * Provider: Class instance that maintains connection to a database/external service
 *           along with some methods for abstracting interaction with service
 * ProviderMap: key-value mapping to access providers
 */

const CONNECTION_TIMEOUT = 20000;

// A class that creates/maintains/destroys a connection
export interface Provider<T = unknown, K = any> {
  name: string;
  connection: T;
  config: K;
  connect: (providerMap: ProviderMap<T>) => Promise<Provider<T,K>["connection"]>;
  disconnect: (...args: unknown[]) => Promise<void>;
  drop?: () => Promise<void>;
  ping?: () => Promise<number>;
}

export type ProviderMap<T=any> = { [index in keyof T]: Provider<T[index]> };

// Creates the DataClient object from an object of DataProviders
const connect = async <T extends ProviderMap>(providerMap: T, log: Logger): Promise<T> => {
  return Object.keys(providerMap).reduce(async (acc, key) => {
    const accumulator = await acc;
    const provider = providerMap[key as keyof T];

    // Show the message now, so if any fields are missing we know to what provider
    log.info(`Connecting to ${provider.name}...`);

    // Throw an error if any fields are missing
    Object.keys(provider.config).forEach(k => {
      if (typeof provider.config[k] == 'undefined') {
        log.error(`Expected field "${k}" in provider ${provider.name}`);
        process.exit(0);
      }
    });

    try {
      // Attempt to connect, passing previous connections through to later ones
      await new Promise((resolve, reject) => {
        const t = setTimeout(() => {
          log.error(`Took took long to connect to service ${provider.name}...`);
          process.exit();
        }, CONNECTION_TIMEOUT);

        provider
          .connect(accumulator as any)
          .catch(e => {
            clearTimeout(t);
            reject(e);
          })
          .then(v => {
            clearTimeout(t);
            resolve(v);
          });
      });

      accumulator[key as keyof T] = provider;
    } catch (error) {
      log.error(`Failed to connect to ${provider.name}`, error);
      process.exit(0);
    }

    return accumulator;
  }, Promise.resolve(<T>{}));
};

// Closes all the connections from the providers object
const disconnect = async <T>(providerMap: ProviderMap<T>) => {
  return Promise.all(Object.keys(providerMap).map(p => providerMap[p].close()));
};

// Get a KV of ping response times from providers
const ping = async <T>(providerMap: ProviderMap<T>): Promise<{ [index in keyof T]: number }> => {
  return (await Promise.all(Object.keys(providerMap).map(p => providerMap[p].ping && providerMap[p].ping()))).reduce(
    (acc, curr, idx) => {
      (acc.data[acc.keys[idx]] = curr), acc;
    },
    { keys: Object.keys(providerMap), data: {} }
  ).data;
};

const drop = async <T>(providerMap: ProviderMap<T>) => {
  return Promise.all(Object.keys(providerMap).map(p => providerMap[p].drop && providerMap[p].drop()));
};

export const DataClient = { connect, disconnect, ping, drop };
export namespace Providers {
  export const Postgres = PostgresProvider;
  export const Mux = MuxProvider;
  export const Redis = RedisProvider;
  export const Influx = InfluxProvider;
  export const LocalTunnel = LocalTunnelProvider;
  export const Store = StoreProvider;
  export const SendGrid = SendGridProvider;
  export const Stripe = StripeProvider;
  export const S3 = S3Provider;
  export const SSE = SSEProvider;
  export const PubSub = PubSubProvider;
};
