import type { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { clearAuthCookie, setAuthCookie } from "../utils/authCookie";
import { AppError } from "../utils/AppError";
import { loginSchema, signupSchema } from "../validation/auth.schema";

export async function signup(req: Request, res: Response) {
  const input = signupSchema.parse(req.body);
  const user = await authService.signup(input);

  setAuthCookie(res, user.id);
  res.status(201).json({ data: user });
}

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const user = await authService.login(input);

  setAuthCookie(res, user.id);
  res.json({ data: user });
}

export function logout(_req: Request, res: Response) {
  clearAuthCookie(res);
  res.json({ message: "Logged out successfully" });
}

export async function getMe(req: Request, res: Response) {
  if (!req.userId) {
    throw new AppError(401, "Authentication required");
  }

  const user = await authService.getUserById(req.userId);
  res.json({ data: user });
}
