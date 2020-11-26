require("dotenv").config();
import express from "express";
import morgan from "morgan";
import bodyParser from "body-parser";
import cors from "cors";
import session from "express-session";
import log from "./common/logger";
import http from "http";
import "reflect-metadata";

import Routes from './routes';
import config from "./config";
import { handleError, ErrorHandler } from "./common/errors";

import { HTTP } from "./common/http";
import { DataClient, DataProvider } from "./common/data";

let server: http.Server;
const app = express();
app.set("trust proxy", 1);
app.use(bodyParser.json());
app.use(cors());
app.use(morgan("tiny", { stream: log.stream }));

(async () => {
  try {
    // Connect to all the databases
    const data = await DataProvider.create();

    // Register Redis session store
    app.use(
      session({
        secret: config.PRIVATE_KEY,
        resave: false,
        saveUninitialized: true,
        cookie: {
          httpOnly: !config.PRODUCTION ? false : true,
          secure: !config.PRODUCTION ? false : true,
        },
        store: data.session_store,
      })
    );
  
    // Register routes
    app.use("/", Routes.router);

    // Catch 404 errors
    app.all("*", (req: any, res: any, next: any) => {
      handleError(req, res, next, new ErrorHandler(HTTP.NotFound, "No such route exists"));
    });

    // Global error handler
    app.use((err: any, req: any, res: any, next: any) => handleError(req, res, next, err));

    // Handle closing connections on failure
    process.on("SIGTERM", graceful_exit(data));
    process.on("SIGINT", graceful_exit(data));

    // Start listening for requests
    server = app.listen(config.EXPRESS_PORT, () => {
      log.info(`Listening on ${config.EXPRESS_PORT}`);
    });
  } catch (err) {
    log.error(err);
  }
})();

function graceful_exit(data:DataClient) {
  return () => {
    log.info(`Termination requested, closing all connections`);
    DataProvider.close(data);
    server.close();
  }
}

export default { app, graceful_exit };
