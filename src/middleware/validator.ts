import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ValidationError } from '../models';

// Middleware to handle validation errors
export const validate = function(req: Request, res: Response, next: NextFunction): void {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  next(new ValidationError(result.array().map(item => item.param)));
};
