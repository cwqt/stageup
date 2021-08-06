import { EOL } from 'os';
import { Direction, Flags, Format, TypeormUml } from 'typeorm-uml';
import { Provider, PG_MODELS, Providers, apiLogger } from '@core/api';

// FIXME  https://github.com/nrwl/nx/issues/2536
(async () => {
  const log = apiLogger('tools');

  const p = await Provider.create(
    {
      pg: new Providers.Postgres(
        {
          host: process.env.POSTGRES_HOST,
          port: parseInt(process.env.POSTGRES_HOST),
          username: process.env.POSTGRES_HOST,
          password: process.env.POSTGRES_HOST,
          database: process.env.POSTGRES_HOST,
          synchronize: false
        },
        PG_MODELS
      )
    },
    log.log
  );

  const flags: Flags = {
    direction: Direction.LR,
    format: Format.SVG,
    handwritten: false
  };

  const typeormUml = new TypeormUml();
  const url = await typeormUml.build(p.connections.pg, flags);
  process.stdout.write('Diagram URL: ' + url + EOL);
})();
