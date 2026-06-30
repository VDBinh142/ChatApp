import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { KnownErrors } from '../errors';

const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = schema.parse(req.body);
    req.body = validated;
    next();
  } catch (error: any) {
    throw new KnownErrors('ERR_INVALID_REQUEST', error.errors);
  }
};

export default validate;
