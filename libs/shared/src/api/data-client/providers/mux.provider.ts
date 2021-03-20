import { timeout } from '@core/shared/helpers';
import Mux from '@mux/mux-node';
import { TIMEOUT } from 'dns';
import { Provider } from '../';

export interface IMuxProviderConfig {
  access_token: string;
  secret_key: string;
  hook_signature: string;
  image_api_endpoint: string;
}

export default class MuxProvider implements Provider<Mux> {
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
    console.log("Start MUX .drop(), this may take a while...");
    const empty =  {
      keys: false,
      streams: false
    }

    while(true) {
      if(empty.keys == false) {
        const signingKeys = await this.connection.Video.SigningKeys.list({ limit: 100 });
        if(signingKeys.length > 0) {
          for(let i=0; i<signingKeys.length; i++) {
            this.connection.Video.SigningKeys.del(signingKeys[i].id);
            await timeout();
          }  
        } else {
          console.log("\tDeleted all Signing Keys");
          empty.keys = true;
        }  
      }

      if(empty.streams == false) {
        const liveStreams = await this.connection.Video.LiveStreams.list({ limit: 100 });
        if(liveStreams.length > 0) {
          for(let i=0; i<liveStreams.length; i++) {
            this.connection.Video.LiveStreams.del(liveStreams[i].id);
            await timeout();
          }  
        } else {
          console.log("\tDeleted all Live Streams");
          empty.streams = true;
        }  
      }

      if(Object.values(empty).every(v => v == true)) break;
    }
    console.log("Dropped all MUX data!");
  }
}
