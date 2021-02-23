import { Logger } from 'winston';
import InfluxProvider from './influx.provider';
import LocalTunnelProvider from './localtunnel.provider';
import MuxProvider from './mux.provider';
import PostgresProvider from './postgres.provider';
import RedisProvider from './redis.provider';
import StoreProvider from './store.provider';

const CONNECTION_TIMEOUT = 10000;

export const connect = async <T>(
  f: Provider<T>['create'],
  connections: DataConnections,
  log: Logger
): Promise<T | void> => {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      log.error('Took took long to connect to service...');
      process.exit();
    }, CONNECTION_TIMEOUT);

    f(connections)
      .catch(e => {
        clearTimeout(t);
        reject(e);
      })
      .then(v => {
        clearTimeout(t);
        resolve(v);
      });
  });
};

// Methods for manipulating a connection
export interface Provider<T = unknown> {
  name: string;
  connection: T;
  config: any;
  create: (connections: DataConnections) => Promise<T>;
  close: (...args: unknown[]) => Promise<void>;
  drop?: () => Promise<void>;
  ping?: () => Promise<number>;
}

// Input for the .create, .close methods to connect/close all providers
export type ProviderMap<T> = { [index in keyof T]: Provider<T[index]> };

// Packages all the connected providers together
export type DataConnections<T = any> = { [index in keyof T]: T[index] };

export type DataClient<T = any> = {
  connections: DataConnections<T>;
  providers: ProviderMap<T>;
};

// Creates the DataClient object from an object of DataProviders
const create = async <T>(providers: ProviderMap<T>, log: Logger): Promise<DataClient<T>> => {
  return Object.keys(providers).reduce(async (acc, key) => {
    const accumulator = await acc;
    const provider = providers[key as keyof T];

    // Show the message now, so if any fields are missing we know to what provider
    log.info(`Connecting to ${provider.name}...`);

    // Throw an error if any fields are missing
    Object.keys(provider.config).forEach(k => {
      if (typeof provider.config[k] == 'undefined') {
        log.error(`Expected field "${k}" in provider ${provider.name}`);
        process.exit(0);
      };
    });

    // Attempt to connect, passing previous connections through to later ones
    try {
      accumulator.connections[key] = await connect(provider.create.bind(provider), accumulator.connections, log);
    } catch (error) {
      log.error(`Failed to connect to ${provider.name}`, error);
      process.exit(0);
    }
    return accumulator;
  }, Promise.resolve(<DataClient<T>>{ connections: {}, providers: providers }));
};

// Closes all the connections from the providers object
const close = async <T>(providers: ProviderMap<T>) => {
  return Promise.all(Object.keys(providers).map(p => providers[p].close()));
};

// Get a KV of ping response times from providers
const ping = async <T>(providers: ProviderMap<T>): Promise<{ [index in keyof T]: number }> => {
  return (await Promise.all(Object.keys(providers).map(p => providers[p].ping && providers[p].ping()))).reduce(
    (acc, curr, idx) => {
      (acc.data[acc.keys[idx]] = curr), acc;
    },
    { keys: Object.keys(providers), data: {} }
  ).data;
};

const drop = async <T>(providers: ProviderMap<T>) => {
  return Promise.all(Object.keys(providers).map(p => providers[p].drop && providers[p].drop()));
};

export const Provider = { create, close, ping, drop };
export const Providers = {
  Postgres: PostgresProvider,
  Mux: MuxProvider,
  Redis: RedisProvider,
  Influx: InfluxProvider,
  LocalTunnel: LocalTunnelProvider,
  Store: StoreProvider
};
