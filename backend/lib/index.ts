require("dotenv").config();
import express from "express";
import morgan from "morgan";
import bodyParser from "body-parser";
import cors from "cors";
import session from "express-session";
import log, { stream } from "./common/logger";
import http from "http";
import helmet from 'helmet';
import "reflect-metadata";

import Routes from './routes';
import config from "./config";
import { ErrCode, HTTP } from "@eventi/interfaces";
import { handleError, ErrorHandler } from "./common/errors";
import { DataClient, DataProvider } from "./common/data";

import validator from 'express-validator';

let server: http.Server;
const app = express();
app.set("trust proxy", 1);
app.use(bodyParser.json());
app.use(cors());
app.use(helmet());
app.use(morgan("tiny", { stream }));

(async () => {
  try {
    // Connect to all the databases
    const providers = await DataProvider.create();

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
        store: providers.session_store,
      })
    );

    // Register routes
    app.use("/", Routes(providers).router);

    // Catch 404 errors
    app.all("*", (req: any, res: any, next: any) => {
      handleError(req, res, next, new ErrorHandler(HTTP.NotFound, ErrCode.NOT_FOUND));
    });

    // Global error handler
    app.use((err: any, req: any, res: any, next: any) => handleError(req, res, next, err));

    // Handle closing connections on failure
    process.on("SIGTERM", gracefulExit(providers));
    process.on("SIGINT", gracefulExit(providers));


    // Start listening for requests
    server = app.listen(config.EXPRESS_PORT, () => {
      log.info(`\x1b[1mExpress listening on ${config.EXPRESS_PORT}\x1b[0m`);
    });
  } catch (err) {
    log.error(err);
  }
})();

function gracefulExit(providers:DataClient) {
  return () => {
    log.info(`Termination requested, closing all connections`);
    DataProvider.close(providers).finally(() => {
      server.close(err => {
        console.log(err);
        process.exitCode = 1;
        process.exit();  
      });  
    });
  }
}

export default {
  app,
  gracefulExit
};
