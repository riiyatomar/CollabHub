import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { ValidationError } from '../utils/ApiError';

export const validate = (schema: z.ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = (error as any).errors.map((e: any) => ({
          field: e.path.slice(1).join('.'),
          message: e.message,
        }));
        next(new ValidationError(errors));
      } else {
        next(error);
      }
    }
  };
};
