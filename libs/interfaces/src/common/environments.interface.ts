export enum Environment {
  Production = 'production',
  Development = 'development',
  Staging = 'staging',
  Testing = 'testing'
}

export interface IBackendEnvironment {
  apiUrl:string;
  frontendUrl:string;
  postgresDatabase:string;
  environment: Environment;
}

export interface IFrontendEnvironment {
  apiUrl:string;
  frontendUrl:string;
  environment: Environment;
}