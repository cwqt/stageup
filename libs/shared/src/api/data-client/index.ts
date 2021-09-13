import { timestamp } from '@core/helpers';
import Container, { Token } from 'typedi';
import { Logger } from './providers/logging.provider';
import { LOGGING_PROVIDER } from './tokens';

/**
 * DataClient: Object with methods for maintaining all providers
 * Provider: Class instance that maintains connection to a database/external service
 *           along with some methods for abstracting interaction with service
 * ProviderMap: key-value mapping to access providers
 */

const CONNECTION_TIMEOUT = 20000;

// A class that creates/maintains/destroys a connection
export interface Provider<T = any, K = any> {
  name: string;
  connection: T;
  config: K;
  connect: (map?: ProviderMap) => Promise<Provider<T, K>['connection']>;
  disconnect: (...args: unknown[]) => Promise<void>;
  drop?: () => Promise<void>;
  ping?: () => Promise<number>;
}

export type ProviderMap = Map<Token<any>, Provider>;

// Creates the DataClient object from an object of DataProviders
const connect = async <T extends ProviderMap>(map: T): Promise<T> => {
  const log = Container.get(LOGGING_PROVIDER);

  for await (const [token, provider] of map.entries()) {
    // Show the message now, so if any fields are missing we know to what provider
    log.info(`Setting up ${provider.name}...`);

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
          log.error(`Took took long to setup service ${provider.name}...`);
          process.exit();
        }, CONNECTION_TIMEOUT);

        provider
          .connect(map)
          .catch(e => {
            clearTimeout(t);
            reject(e);
          })
          .then(v => {
            clearTimeout(t);
            provider.connection = v;
            resolve(v);
          });
      });

      // Populate IoC container with instantiated & connected provider
      Container.set(token, provider.connection);
    } catch (error) {
      log.error(`Failed to connect to ${provider.name}`, error);
      process.exit(0);
    }
  }

  return map;
};

// Closes all the connections from the providers object
const disconnect = async (map: ProviderMap) => {
  return Promise.all(Object.values(map).map((p: Provider) => p.disconnect()));
};

// // Get a KV of ping response times from providers
// const ping = async <T>(providerMap: ProviderMap<T>): Promise<{ [index in keyof T]: number }> => {
//   return (await Promise.all(Object.values(providerMap).map((p:Provider) => p.ping?.()))).reduce(
//     (acc, curr, idx) => {
//       (acc.data[acc.keys[idx]] = curr), acc;
//     },
//     { keys: Object.keys(providerMap), data: {} }
//   ).data;
// };

const drop = async (providerMap: ProviderMap) => {
  return Promise.all(Object.keys(providerMap).map(p => providerMap[p].drop && providerMap[p].drop()));
};

export const DataClient = { connect, disconnect, drop };
