const { validationResult } = require("express-validator");
import { ErrorHandler } from "./errors";
import { Request, Response, NextFunction } from "express";
import { HTTP } from "@eventi/interfaces";

export const validate = (validations: Function[]) => {
  return (req: Request, res: Response | null, next: NextFunction) => {
    Promise.all(validations.map((validation: any) => validation.run(req))).then(() => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(new ErrorHandler(HTTP.BadRequest, "Invalid form data", errors.array()));
      }

      next();
    });
  };
};
