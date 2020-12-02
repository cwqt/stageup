import { Request, Response, NextFunction } from "express";
import log from "./logger";
import { HTTP } from "./http";

export const handleError = (
  req: Request,
  res: Response,
  next: NextFunction,
  err: ErrorHandler | Error
) => {
  let ErrorType: HTTP;
  let message: string = err.message;

  if (err instanceof ErrorHandler) {
    ErrorType = err.ErrorType;
  } else {
    ErrorType = HTTP.ServerError;
  }

  let response = {
    status: `${ErrorType}`.startsWith("4") ? "fail" : "error",
    statusCode: ErrorType || 520,
    message: message,
  };

  log.error(`(${ErrorType}) --> ${JSON.stringify(err.message)}`);
  if (ErrorType !== HTTP.NotFound) {
    console.log(err.stack);
  }

  res.status(response.statusCode).json(response);
};

export class ErrorHandler extends Error {
  ErrorType: HTTP;

  constructor(statusCode: HTTP, message?: any) {
    super();
    this.ErrorType = statusCode;
    this.message = message || "An error occured.";
  }
}

export interface IFormErrorField {
  param: string;
  msg: string;
  value: any;
}

export class FormErrorResponse {
  errors: IFormErrorField[];
  constructor() {
    this.errors = [];
  }
  push(param: string, message: string, value: any) {
    this.errors.push({ param: param, msg: message, value: value });
  }
  get value() {
    return this.errors;
  }
}
