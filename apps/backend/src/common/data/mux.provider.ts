import Env from '../../env';
import log from '../logger';
import Mux from '@mux/mux-node';

export const create = async (): Promise<Mux> => {
  log.info('Connecting to Mux...');
  if (typeof Env.MUX.ACCESS_TOKEN === 'undefined') {
    throw new TypeError('Missing .env MUX_ACCESS_TOKEN');
  }

  if (typeof Env.MUX.SECRET_KEY === 'undefined') {
    throw new TypeError('Missing .env MUX_SECRET_KEY');
  }

  try {
    const mux = new Mux(Env.MUX.ACCESS_TOKEN, Env.MUX.SECRET_KEY);
    return mux;
  } catch (error: unknown) {
    log.error('Unable to connect to MUX', error);
    throw error;
  }
};

export default { create };
