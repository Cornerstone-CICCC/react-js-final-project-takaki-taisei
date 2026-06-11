import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";
import { AUTH_COOKIE_NAME } from "../utils/authCookie";
import { AppError } from "../utils/AppError";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE_NAME];

  if (!token) {
    return next(new AppError(401, "Authentication required"));
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;

    if (typeof payload.userId !== "string") {
      throw new Error("Invalid token payload");
    }

    req.userId = payload.userId;
    return next();
  } catch {
    return next(new AppError(401, "Invalid or expired authentication token"));
  }
}
