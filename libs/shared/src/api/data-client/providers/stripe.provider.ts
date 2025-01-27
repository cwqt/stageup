import { Provider } from '../index';

import Stripe from 'stripe';

export interface IStripeProviderConfig {
  public_key: string;
  private_key: string;
  webhook_signature: string;
  client_id: string;
}

import { Service, Token } from 'typedi';

@Service()
export class StripeProvider implements Provider<Stripe> {
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
