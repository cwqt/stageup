import { Environment, IBackendEnvironment } from "@core/interfaces";

export const environment:IBackendEnvironment = {
  environment: Environment.Production,
  apiUrl: "https://stageup.uk/api",
  frontendUrl: "https://stageup.uk",
  postgresDatabase: "postgres",
}