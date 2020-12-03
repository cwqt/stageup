import config from "../../config";
import log from "../logger";
import Mux from  '@mux/mux-node';

export const create = async (): Promise<Mux> => {
  log.info(`Connecting to Mux...`);

  try {
    const mux = new Mux(config.MUX.ACCESS_TOKEN, config.MUX.SECRET_KEY);
    return mux;
  } catch (error) {
    log.error(
      "Unable to connect to MUX."
    );
    throw error;
  }
};

export default { create };
