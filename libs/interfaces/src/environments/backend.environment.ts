import { Environment } from "./environments";

export interface IBackendEnvironment {
  apiUrl:string;
  frontendUrl:string;
  postgresDatabase:string;
  environment: Environment;
}