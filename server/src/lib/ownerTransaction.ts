import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

// All hierarchy mutations and cleanup workers use the same transaction lock.
// This serializes moves/deletes/uploads for one owner across server instances.
export async function withOwnerTransaction<T>(
  ownerId: string,
  work: (tx: Prisma.TransactionClient) => Promise<T>,
) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${ownerId}, 0))`;
    return work(tx);
  }, { timeout: 45000, maxWait: 10000 });
}
