import { timeout } from '@core/helpers';
import Mux from '@mux/mux-node';
import { Service, Token } from 'typedi';
import { Provider } from '../';

export interface IMuxProviderConfig {
  access_token: string;
  secret_key: string;
  webhook_signature: string;
  data_env_key: string;
}

@Service()
export class MuxProvider implements Provider<Mux> {
  name = 'Mux';
  connection: Mux;
  config: IMuxProviderConfig;

  constructor(config: IMuxProviderConfig) {
    this.config = config;
  }

  async connect() {
    this.connection = new Mux(this.config.access_token, this.config.secret_key);
    return this.connection;
  }

  async disconnect() {
    return;
  }

  async drop() {
    console.log('Start MUX .drop(), this may take a while...');
    const empty = {
      keys: false,
      streams: false,
      assets: false
    };

    while (true) {
      // Signing Keys
      if (empty.keys == false) {
        const signingKeys = await this.connection.Video.SigningKeys.list({ limit: 100 });
        if (signingKeys.length > 0) {
          for (let i = 0; i < signingKeys.length; i++) {
            console.log('Deleted Signing Key', i);
            await this.connection.Video.SigningKeys.del(signingKeys[i].id);
            await timeout(500);
          }
        } else {
          console.log('\tDeleted all Signing Keys');
          empty.keys = true;
        }
      }

      // Assets
      if (empty.assets == false) {
        const assets = await this.connection.Video.Assets.list({ limit: 100 });
        if (assets.length > 0) {
          for (let i = 0; i < assets.length; i++) {
            await this.connection.Video.Assets.del(assets[i].id);
            console.log('Deleted Asset', i);
            await timeout(500);
          }
        } else {
          console.log('\tDeleted all Assets');
          empty.assets = true;
        }
      }

      // Live streams
      if (empty.streams == false) {
        const liveStreams = await this.connection.Video.LiveStreams.list({ limit: 100 });
        if (liveStreams.length > 0) {
          for (let i = 0; i < liveStreams.length; i++) {
            await this.connection.Video.LiveStreams.del(liveStreams[i].id);
            console.log('Deleted Stream', i);
            await timeout(500);
          }
        } else {
          console.log('\tDeleted all Live Streams');
          empty.streams = true;
        }
      }

      if (Object.values(empty).every(v => v == true)) break;
    }
    console.log('Dropped all MUX data!');
  }
}
