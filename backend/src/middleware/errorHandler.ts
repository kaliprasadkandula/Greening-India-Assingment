import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors';
import { logger } from '../config/logger';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.fields && { fields: err.fields }),
    });
    return;
  }

  logger.error(err, 'Unhandled error');
  res.status(500).json({ error: 'internal server error' });
}
