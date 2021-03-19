import { Provider } from '../index';

import Stripe from 'stripe';

export interface IStripeProviderConfig {
  public_key: string;
  private_key: string;
  hook_signature: string;
}

export default class StripeProvider implements Provider<Stripe> {
  name = 'Stripe';
  connection: Stripe;
  config: IStripeProviderConfig;

  constructor(config: IStripeProviderConfig) {
    this.config = config;
  }

  async connect() {
    this.connection = new Stripe(this.config.private_key, {
      apiVersion: '2020-08-27'
    });

    return this.connection;
  }

  async disconnect() {
    return;
  }

  async drop() {
    return;
  }
}
