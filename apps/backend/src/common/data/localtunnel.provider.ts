import Env from '../../env';
import log from '../logger';
import localtunnel from 'localtunnel';

export const create = async (): Promise<localtunnel.Tunnel> => {
  log.info(`Opening up localtunnel on port ${Env.EXPRESS_PORT}...`);
  if (typeof Env.LOCALTUNNEL_URL === 'undefined') {
    throw new TypeError('Missing .env LOCALTUNNEL_URL');
  }

  try {
    const lt = await localtunnel({
      port: Env.EXPRESS_PORT,
      subdomain: Env.LOCALTUNNEL_URL
    });

    return lt;
  } catch (error: unknown) {
    log.error('Unable to start localtunnel server.');
    throw error;
  }
};

export const close = async (lt: localtunnel.Tunnel): Promise<void> => {
  return new Promise((resolve, reject) => {
    lt.close();
    resolve();
  });
};

export default { create, close };
