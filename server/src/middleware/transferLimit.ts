import type { RequestHandler } from 'express';
import { AppError } from '../utils/AppError';

// The current API buffers files. Bound per-process memory for concurrent transfers.
let active = 0;
export const transferLimit: RequestHandler = (_req, res, next) => {
  if (active >= 4) return next(new AppError(503, 'File transfer capacity reached; please retry'));
  active++;
  let released = false;
  let handlerRunning = false;
  const release = () => { if (!released) { released = true; active--; } };
  res.locals.transferLease = {
    start: () => { handlerRunning = true; },
    done: () => { handlerRunning = false; if (res.writableFinished || res.destroyed) release(); },
  };
  const onResponseEnd = () => { if (!handlerRunning) release(); };
  // A disconnected browser does not cancel an in-flight Storage operation.
  // Keep its slot until asyncHandler has finished that operation.
  res.once('finish', onResponseEnd); res.once('close', onResponseEnd);
  next();
};
