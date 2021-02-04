import { Environment, IBackendEnvironment } from "@core/interfaces";

export const environment:IBackendEnvironment = {
  environment: Environment.Staging,
  apiUrl: "https://staging.stageup.uk/api",
  frontendUrl: "https://staging.stageup.uk",
  postgresDatabase: "postgres",
}