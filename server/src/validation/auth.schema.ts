import { z } from "zod";

const emailSchema = z.string().trim().email("A valid email is required").toLowerCase();
const passwordSchema = z.string().min(8, "Password must be at least 8 characters")
  .refine((value) => Buffer.byteLength(value) <= 72, "Password must be at most 72 UTF-8 bytes");

export const signupSchema = z.object({
  username: z.string().trim().min(1, "Username is required").max(100, "Username is too long"),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(1024),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
