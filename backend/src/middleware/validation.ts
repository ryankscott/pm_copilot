import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

export const validate = (schema: z.ZodObject<any, any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({
          message: 'Validation failed',
          errors: validationError.details,
        });
      } else {
        res.status(500).json({ message: 'Internal Server Error' });
      }
    }
  };
};
