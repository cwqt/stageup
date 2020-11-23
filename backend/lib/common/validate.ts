const { validationResult } = require("express-validator");
import { ErrorHandler } from "./errorHandler";
import { Request, Response, NextFunction } from "express";

export const validate = (validations: Function[]) => {
  return (req: Request, res: Response | null, next: NextFunction) => {
    Promise.all(validations.map((validation: any) => validation.run(req))).then(() => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(new ErrorHandler(422, errors.array()));
      }

      next();
    });
  };
};
