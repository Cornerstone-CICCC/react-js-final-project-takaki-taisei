import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import type { LoginInput, SignupInput } from "../validation/auth.schema";

const publicUserSelect = {
  id: true,
  username: true,
  email: true,
} as const;

export async function signup(input: SignupInput) {
  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });

  if (existingUser) {
    throw new AppError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  return prisma.user.create({
    data: {
      username: input.username,
      email: input.email,
      passwordHash,
    },
    select: publicUserSelect,
  });
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new AppError(401, "Invalid email or password");
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
  };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: publicUserSelect,
  });

  if (!user) {
    throw new AppError(401, "User no longer exists");
  }

  return user;
}
