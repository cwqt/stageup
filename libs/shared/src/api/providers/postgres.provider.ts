import { Connection, Entity, createConnection } from 'typeorm';
import { Provider } from '.';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

export interface IPostgresProviderConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize?: boolean;
}

export default class PostgresProvider implements Provider<Connection> {
  name = 'Postgres';
  connection: Connection;
  config: IPostgresProviderConfig;
  models: any[];

  constructor(config: IPostgresProviderConfig, models: any[]) {
    this.config = config;
    this.models = models;
  }

  async create() {
    this.connection = await createConnection({
      type: 'postgres',
      host: this.config.host,
      port: this.config.port,
      username: this.config.username,
      password: this.config.password,
      database: this.config.database,
      entities: this.models,
      synchronize: this.config.synchronize,
      logging: false,
      namingStrategy: new SnakeNamingStrategy()
    });

    return this.connection;
  }

  close() {
    return this.connection.close();
  }

  async drop() {
    await this.connection.synchronize(true); // https://github.com/nestjs/nest/issues/409
  }
}

// const close = async (client: DataClient<any>) => {
//   await client.torm.close();
// };

// import { EOL } from 'os';
// import { Direction, Flags, Format, TypeormUml } from 'typeorm-uml';
// const generateUML = async (conn: TORM.Connection) => {
// if(Env.isEnv(Environment.Development)) {

//     const flags: Flags = {
//       direction: Direction.LR,
//       format: Format.SVG,
//       handwritten: false
//     };

//     const typeormUml = new TypeormUml();
//     const url = await typeormUml.build(conn, flags);
//     process.stdout.write('Diagram URL: ' + url + EOL);
//   }
// }
