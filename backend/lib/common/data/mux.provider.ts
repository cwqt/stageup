import config from '../../config';
import log from '../logger';
import Mux from '@mux/mux-node';

export const create = async (): Promise<Mux> => {
  log.info(`Connecting to Mux...`);
  if(typeof config.MUX.ACCESS_TOKEN == 'undefined') throw new Error(`Missing .env MUX_ACCESS_TOKEN`);
  if(typeof config.MUX.SECRET_KEY == 'undefined')   throw new Error(`Missing .env MUX_SECRET_KEY`);

  try {
    const mux = new Mux(config.MUX.ACCESS_TOKEN, config.MUX.SECRET_KEY);
    return mux;
  } catch (error) {
    log.error('Unable to connect to MUX', error);
    throw error;
  }
};

export default { create };
