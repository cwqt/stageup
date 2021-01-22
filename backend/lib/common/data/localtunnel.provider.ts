// const localtunnel = require('localtunnel');

// (async () => {
//   const tunnel = await localtunnel({ port: 3000 });

//   // the assigned public url for your tunnel
//   // i.e. https://abcdefgjhij.localtunnel.me
//   tunnel.url;

//   tunnel.on('close', () => {
//     // tunnels are closed
//   });
// })();

import config from '../../config';
import log from '../logger';
import localtunnel from 'localtunnel';

export const create = async (): Promise<localtunnel.Tunnel> => {
  log.info(`Opening up localtunnel on port ${config.EXPRESS_PORT}...`);
  if(typeof config.LOCALTUNNEL_URL == 'undefined') throw new Error(`Missing .env LOCALTUNNEL_URL`);

  try {
    const lt = await localtunnel({
      port: config.EXPRESS_PORT,
      subdomain: config.LOCALTUNNEL_URL
    });

    return lt;
  } catch (error) {
    log.error('Unable to start localtunnel server.');
    throw error;
  }
};

export const close = async (lt: localtunnel.Tunnel): Promise<void> => {
  return new Promise((res, rej) => {
    lt.close();
    res();
  });
};

export default { create, close };
