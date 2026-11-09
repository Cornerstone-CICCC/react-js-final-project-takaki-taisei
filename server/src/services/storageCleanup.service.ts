import { prisma } from "../lib/prisma";
import { withOwnerTransaction } from "../lib/ownerTransaction";
import { assertStorageKey, storage } from "../lib/storage";

// Rows are durable upload intents or deletion jobs. Never scan/delete arbitrary
// bucket objects: migration objects without an explicit job are left untouched.
export async function processStorageCleanup(limit = 25) {
  const jobs = await prisma.storageCleanup.findMany({
    where: { nextAttemptAt: { lte: new Date() } },
    orderBy: { nextAttemptAt: "asc" }, take: limit,
  });
  for (const job of jobs) {
    try {
      await withOwnerTransaction(job.ownerId, async (tx) => {
        const current = await tx.storageCleanup.findUnique({ where: { storageKey: job.storageKey } });
        if (!current || current.nextAttemptAt > new Date()) return;
        assertStorageKey(current.storageKey, current.ownerId, current.nodeId);
        const referenced = await tx.node.findUnique({ where: { storageKey: current.storageKey }, select: { id: true } });
        if (referenced) throw new Error("Referenced object cannot be cleaned up");
        await storage.remove(current.storageKey);
        await tx.storageCleanup.delete({ where: { storageKey: current.storageKey } });
      });
    } catch {
      await prisma.storageCleanup.updateMany({
        where: { storageKey: job.storageKey },
        data: {
          attempts: { increment: 1 }, lastError: "cleanup_failed",
          nextAttemptAt: new Date(Date.now() + Math.min(3600000, 30000 * 2 ** Math.min(job.attempts, 7))),
        },
      });
      console.error(JSON.stringify({ event: "storage_cleanup_failed", jobId: job.id }));
    }
  }
}
