import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  // Error objects can include connection credentials or SQL parameters.
  log: [],
});
