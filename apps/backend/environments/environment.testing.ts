import { Environment, IBackendEnvironment } from "@core/interfaces";

export const environment:IBackendEnvironment = {
  environment: Environment.Testing,
  apiUrl: "http://localhost:3000",
  frontendUrl: "http://localhost:4200",
  postgresDatabase: "testing",
}