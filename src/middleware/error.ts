import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../models';
import { logger } from '../middleware';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = function(err: HttpError, req: Request, res: Response, next: NextFunction): void {
  const status = err.status || 500;
  const message = err.message || 'Oops, something went wrong';

  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const logObject = {
    method: req.method,
    status,
    message,
    url: req.originalUrl,
    ip,
    userAgent: req.headers['user-agent']
  };

  logger.error(logObject); // Log error
  res.status(status).send({ status, message });
};
