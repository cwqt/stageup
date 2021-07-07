import inquirer from 'inquirer';
import { apiLogger, DataClient, PG_MODELS, ProviderMap, Providers } from '@core/api';
import { Seeder } from './recipes/seeder';
const log = apiLogger('seeder').log;

require('dotenv-flow').config({ node_env: 'development', silent: true });

export interface SeederProviderMap extends ProviderMap {
  torm: InstanceType<typeof Providers.Postgres>;
  stripe: InstanceType<typeof Providers.Stripe>;
}

console.clear();

(async () => {
  // Setup a connection to the local postgres database
  const providers = await DataClient.connect<SeederProviderMap>(
    {
      torm: new Providers.Postgres(
        {
          username: process.env.POSTGRES_USER,
          password: process.env.POSTGRES_PASSWORD,
          host: process.env.POSTGRES_HOST,
          database: process.env.POSTGRES_DB,
          port: 5432,
          synchronize: true
        },
        PG_MODELS
      ),
      stripe: new Providers.Stripe({
        public_key: process.env.STRIPE_PUBLIC_KEY,
        private_key: process.env.STRIPE_PRIVATE_KEY,
        webhook_signature: process.env.STRIPE_WEBHOOK_SIGNATURE,
        client_id: process.env.STRIPE_CLIENT_ID
      })
    },
    log
  );

  await providers.torm.drop();

  await new Seeder(providers).run();

  log.info('Seeder finished');

  // And finally disconnect
  await DataClient.disconnect(providers);
})();
