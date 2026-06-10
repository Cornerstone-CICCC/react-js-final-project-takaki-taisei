import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { MulterError } from 'multer';
import { AppError } from '../utils/AppError';

/**
 * Central error handler. Maps known error types to clean JSON responses.
 * Must be registered last, after all routes.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Invalid request data',
      details: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.name, message: err.message });
  }

  if (err instanceof MulterError) {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({ error: 'UploadError', message: err.message });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Conflict', message: 'Name already exists in this folder' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'NotFound', message: 'Resource not found' });
    }
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({ error: 'InternalServerError', message: 'Something went wrong' });
}
