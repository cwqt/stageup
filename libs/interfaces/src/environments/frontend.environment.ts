import { Environment } from "./environments";

export interface IFrontendEnvironment {
  apiUrl:string;
  frontendUrl:string;
  environment: Environment;
}