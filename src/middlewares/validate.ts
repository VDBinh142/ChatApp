import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import { KnownErrors } from "../errors";

export const validate =
  (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error: any) {
      throw new KnownErrors("ERR_INVALID_REQUEST", error?.errors ?? error?.message);
    }
  };

export default validate;
