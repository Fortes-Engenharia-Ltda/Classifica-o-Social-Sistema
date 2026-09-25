import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export const loggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const ip = req.ip || req.socket.remoteAddress;

    logger.info(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - IP: ${ip}`);
  });

  next();
};
