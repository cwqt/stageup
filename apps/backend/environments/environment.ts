import { Environment, IBackendEnvironment } from "@core/interfaces";

export const environment:IBackendEnvironment = {
  environment: Environment.Development,
  apiUrl: "http://localhost:3000",
  frontendUrl: "http://localhost:4200",
  postgresDatabase: "postgres",
}