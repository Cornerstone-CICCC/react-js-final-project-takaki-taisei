CREATE TABLE "StorageCleanup" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "storageKey" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "nodeId" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "StorageCleanup_storageKey_key" ON "StorageCleanup"("storageKey");
CREATE INDEX "StorageCleanup_nextAttemptAt_idx" ON "StorageCleanup"("nextAttemptAt");
