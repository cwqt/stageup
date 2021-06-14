import { Connection, Entity, createConnection } from 'typeorm';
import { Provider } from '../';
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

  async connect() {
    this.connection = await createConnection({
      type: 'postgres',
      host: this.config.host,
      port: this.config.port,
      username: this.config.username,
      password: this.config.password,
      database: this.config.database,
      entities: this.models,
      synchronize: this.config.synchronize,
      logging: false, // print all sql queries
      namingStrategy: new SnakeNamingStrategy()
    });

    return this.connection;
  }

  disconnect() {
    return this.connection.close();
  }

  async drop() {
    await this.connection.synchronize(true); // https://github.com/nestjs/nest/issues/409
  }
}
