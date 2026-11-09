import type { NextFunction, Request, Response } from 'express';

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown;

/**
 * Wraps an async route handler so rejected promises are forwarded to Express'
 * error-handling middleware instead of crashing the process.
 */
export const asyncHandler =
  (fn: Handler) => (req: Request, res: Response, next: NextFunction) => {
    if (res.destroyed) return;
    const lease = res.locals.transferLease;
    lease?.start();
    Promise.resolve().then(() => fn(req, res, next)).catch(next).finally(() => lease?.done());
  };
