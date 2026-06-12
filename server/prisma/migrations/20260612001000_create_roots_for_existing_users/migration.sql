INSERT INTO "Node" (
    "id",
    "name",
    "type",
    "ownerId",
    "parentId",
    "createdAt",
    "updatedAt"
)
SELECT
    'root-' || "User"."id",
    'root',
    'FOLDER',
    "User"."id",
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "User"
WHERE NOT EXISTS (
    SELECT 1
    FROM "Node"
    WHERE "Node"."ownerId" = "User"."id"
      AND "Node"."parentId" IS NULL
      AND "Node"."type" = 'FOLDER'
);
