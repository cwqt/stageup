export enum Environment {
  Production = 'production',
  Development = 'development',
  Staging = 'staging',
  Testing = 'testing'
}

export interface IStaticFrontendEnvironment {
  app_version: string;
  is_deployed: boolean;
}

export interface IDynamicFrontendEnvironment {
  frontend_url: string;
  stripe_public_key: string;
  environment: Environment;
  mux_env_key: string;
  google_auth_app_id: string;
  facebook_auth_app_id: string;
}
