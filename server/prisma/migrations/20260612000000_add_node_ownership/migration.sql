PRAGMA foreign_keys=OFF;

INSERT OR IGNORE INTO "User" (
    "id",
    "username",
    "email",
    "passwordHash",
    "createdAt",
    "updatedAt"
)
VALUES (
    'legacy-node-owner',
    'Legacy Node Owner',
    'legacy-node-owner@local.invalid',
    '!',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

CREATE TABLE "new_Node" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "data" BLOB,
    "mimeType" TEXT,
    "size" INTEGER,
    "ownerId" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Node_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Node_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "new_Node" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_Node" (
    "id",
    "name",
    "type",
    "content",
    "data",
    "mimeType",
    "size",
    "ownerId",
    "parentId",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "name",
    "type",
    "content",
    "data",
    "mimeType",
    "size",
    'legacy-node-owner',
    "parentId",
    "createdAt",
    "updatedAt"
FROM "Node";

DROP TABLE "Node";
ALTER TABLE "new_Node" RENAME TO "Node";

CREATE INDEX "Node_parentId_idx" ON "Node"("parentId");
CREATE INDEX "Node_ownerId_idx" ON "Node"("ownerId");
CREATE UNIQUE INDEX "Node_ownerId_parentId_name_key" ON "Node"("ownerId", "parentId", "name");

PRAGMA foreign_keys=ON;
