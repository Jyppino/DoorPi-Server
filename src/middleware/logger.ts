import { Request, Response, NextFunction } from 'express';
import { createLogger, format, transports } from 'winston';
import { logPath } from '../config/config';

// datetime | request method | response status | message | url | IP | User-Agent
const defaultFormat = format.printf(({ method, status, message, url, ip, userAgent }) => {
  return `${new Date().toUTCString()} | ${method} | ${status} | ${message} | ${url} | ${ip} | ${userAgent}`;
});

const silent = process.env.NODE_ENV === 'TEST'; // Don't log when running tests

export const logger = createLogger({
  level: 'info',
  format: defaultFormat,
  transports: [
    new transports.Console({ silent, level: 'info', format: format.combine(format.colorize(), defaultFormat) }),
    new transports.File({
      silent,
      filename: logPath,
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

export const httpLogger = function(req: Request, res: Response, next: NextFunction): void {
  res.on('finish', () => {
    const successCodes = [200, 304];
    if (!successCodes.includes(res.statusCode)) return; // Log successful response only, errors handled by errorHandler

    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const logObject = {
      method: req.method,
      status: res.statusCode,
      message: res.statusMessage,
      url: req.originalUrl,
      ip,
      userAgent: req.headers['user-agent']
    };

    logger.info(logObject);
  });
  next();
};
