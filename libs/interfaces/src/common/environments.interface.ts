export enum Environment {
  Production = 'production',
  Development = 'development',
  Staging = 'staging',
  Testing = 'testing'
}

export interface IFrontendEnvironment {
  frontend_url: string;
  app_version: string;
  is_deployed: boolean;
  stripe_public_key: string;
  environment: Environment;
}
