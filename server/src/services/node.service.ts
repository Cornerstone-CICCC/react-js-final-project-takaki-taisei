import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { NodeType, ROOT_ID } from "../types/node.types";

// Columns returned for metadata/listing. Deliberately EXCLUDES `data` (the BLOB)
// so listing the tree never loads image bytes into memory.
const nodeSelect = {
  id: true,
  name: true,
  type: true,
  content: true,
  mimeType: true,
  size: true,
  parentId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.NodeSelect;

type NodeView = Prisma.NodeGetPayload<{ select: typeof nodeSelect }>;

// ---------- shaping helpers ----------

/** Public representation of a node (never includes the raw binary bytes). */
function toPublic(node: NodeView) {
  const base = {
    id: node.id,
    name: node.name,
    type: node.type,
    parentId: node.parentId,
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
  };
  if (node.type !== NodeType.FILE) return base;

  // A file with no text content is a binary (uploaded) file.
  const isBinary = node.content === null;
  return {
    ...base,
    isBinary,
    mimeType:
      node.mimeType ??
      (isBinary ? "application/octet-stream" : "text/plain; charset=utf-8"),
    size: node.size ?? (node.content ? Buffer.byteLength(node.content) : 0),
    // The frontend fetches/streams the actual bytes (or text) from here.
    rawUrl: `/api/nodes/${node.id}/raw`,
    ...(isBinary ? {} : { content: node.content ?? "" }),
  };
}

/** Folders first, then files; each group sorted alphabetically (case-insensitive). */
function sortNodes(a: NodeView, b: NodeView): number {
  if (a.type !== b.type) return a.type === NodeType.FOLDER ? -1 : 1;
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

// ---------- internal lookups ----------

async function findOrThrow(id: string): Promise<NodeView> {
  const node = await prisma.node.findUnique({
    where: { id },
    select: nodeSelect,
  });
  if (!node) throw new AppError(404, `Node not found: ${id}`);
  return node;
}

async function assertFolder(id: string): Promise<NodeView> {
  const node = await findOrThrow(id);
  if (node.type !== NodeType.FOLDER)
    throw new AppError(400, `Node is not a folder: ${id}`);
  return node;
}

/** Rejects a name that is already taken by a sibling in the same folder. */
async function assertNameAvailable(
  parentId: string,
  name: string,
  excludeId?: string,
): Promise<void> {
  const clash = await prisma.node.findFirst({
    where: { parentId, name, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    select: { id: true },
  });
  if (clash) throw new AppError(409, `"${name}" already exists in this folder`);
}

type Crumb = { id: string; name: string; parentId: string | null };

/** Ancestor chain from the root down to (and including) the given node. */
async function buildPath(
  node: Crumb,
): Promise<Array<{ id: string; name: string }>> {
  const path: Array<{ id: string; name: string }> = [];
  let current: Crumb | null = node;
  while (current) {
    path.unshift({ id: current.id, name: current.name });
    if (!current.parentId) break;
    current = await prisma.node.findUnique({
      where: { id: current.parentId },
      select: { id: true, name: true, parentId: true },
    });
  }
  return path;
}

/** True if `candidateId` lives somewhere inside the subtree rooted at `ancestorId`. */
async function isDescendantOf(
  candidateId: string,
  ancestorId: string,
): Promise<boolean> {
  let current = await prisma.node.findUnique({
    where: { id: candidateId },
    select: { id: true, parentId: true },
  });
  while (current && current.parentId) {
    if (current.parentId === ancestorId) return true;
    current = await prisma.node.findUnique({
      where: { id: current.parentId },
      select: { id: true, parentId: true },
    });
  }
  return false;
}

function translatePrisma(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002")
      throw new AppError(
        409,
        "A node with this name already exists in this folder",
      );
    if (error.code === "P2025") throw new AppError(404, "Node not found");
  }
  throw error;
}

// ---------- public operations ----------

/** Returns the whole tree as a nested structure rooted at the root folder. */
export async function getTree() {
  const all = await prisma.node.findMany({ select: nodeSelect });

  const childrenByParent = new Map<string | null, NodeView[]>();
  for (const node of all) {
    const list = childrenByParent.get(node.parentId) ?? [];
    list.push(node);
    childrenByParent.set(node.parentId, list);
  }

  const build = (node: NodeView): Record<string, unknown> => {
    const shaped = toPublic(node);
    if (node.type !== NodeType.FOLDER) return shaped;
    const children = (childrenByParent.get(node.id) ?? [])
      .sort(sortNodes)
      .map(build);
    return { ...shaped, children };
  };

  const root = all.find((n) => n.id === ROOT_ID);
  if (!root)
    throw new AppError(500, "Root folder is missing — run `npm run seed`.");
  return build(root);
}

/** Node metadata plus its breadcrumb path and (for folders) immediate children. */
export async function getNode(id: string) {
  const node = await findOrThrow(id);
  const path = await buildPath(node);

  let children: ReturnType<typeof toPublic>[] | undefined;
  if (node.type === NodeType.FOLDER) {
    const kids = await prisma.node.findMany({
      where: { parentId: node.id },
      select: nodeSelect,
    });
    children = kids.sort(sortNodes).map(toPublic);
  }

  return { ...toPublic(node), path, children };
}

/** Create a folder or a TEXT file. (Binary files come in via `uploadNode`.) */
export async function createNode(input: {
  name: string;
  type: NodeType;
  parentId?: string;
  content?: string;
}) {
  const parentId = input.parentId ?? ROOT_ID;
  await assertFolder(parentId);
  await assertNameAvailable(parentId, input.name);

  const isFile = input.type === NodeType.FILE;
  try {
    const created = await prisma.node.create({
      data: {
        name: input.name,
        type: input.type,
        parentId,
        content: isFile ? (input.content ?? "") : null,
        size: isFile ? Buffer.byteLength(input.content ?? "") : null,
      },
      select: nodeSelect,
    });
    return toPublic(created);
  } catch (error) {
    translatePrisma(error);
  }
}

/** Persist an uploaded binary file (PNG, etc.) as a BLOB. */
export async function uploadNode(input: {
  name: string;
  parentId?: string;
  mimeType: string;
  buffer: Buffer;
}) {
  const parentId = input.parentId ?? ROOT_ID;
  await assertFolder(parentId);

  const name = input.name.trim();
  if (!name) throw new AppError(400, "File name is required");
  if (name.includes("/")) throw new AppError(400, 'name cannot contain "/"');
  await assertNameAvailable(parentId, name);

  try {
    const created = await prisma.node.create({
      data: {
        name,
        type: NodeType.FILE,
        parentId,
        content: null,
        data: new Uint8Array(input.buffer),
        mimeType: input.mimeType,
        size: input.buffer.length,
      },
      select: nodeSelect,
    });
    return toPublic(created);
  } catch (error) {
    translatePrisma(error);
  }
}

/** Rename a node and/or edit a TEXT file's content. */
export async function updateNode(
  id: string,
  input: { name?: string; content?: string },
) {
  const node = await findOrThrow(id);

  const data: Prisma.NodeUpdateInput = {};

  if (input.name !== undefined && input.name !== node.name) {
    if (node.id === ROOT_ID)
      throw new AppError(400, "Cannot rename the root folder");
    await assertNameAvailable(node.parentId ?? ROOT_ID, input.name, node.id);
    data.name = input.name;
  }

  if (input.content !== undefined) {
    if (node.type !== NodeType.FILE)
      throw new AppError(400, "Only files can have content");
    if (node.content === null)
      throw new AppError(400, "Cannot edit a binary file as text");
    data.content = input.content;
    data.size = Buffer.byteLength(input.content);
  }

  if (Object.keys(data).length === 0) return toPublic(node);

  try {
    const updated = await prisma.node.update({
      where: { id },
      data,
      select: nodeSelect,
    });
    return toPublic(updated);
  } catch (error) {
    translatePrisma(error);
  }
}

/** Move a node into a different folder (with cycle and name-collision guards). */
export async function moveNode(id: string, newParentId: string) {
  if (id === ROOT_ID) throw new AppError(400, "Cannot move the root folder");

  const node = await findOrThrow(id);
  await assertFolder(newParentId);

  if (newParentId === id)
    throw new AppError(400, "Cannot move a node into itself");
  if (await isDescendantOf(newParentId, id)) {
    throw new AppError(
      400,
      "Cannot move a folder into one of its own descendants",
    );
  }

  if (newParentId !== node.parentId) {
    await assertNameAvailable(newParentId, node.name, node.id);
  }

  try {
    const updated = await prisma.node.update({
      where: { id },
      data: { parentId: newParentId },
      select: nodeSelect,
    });
    return toPublic(updated);
  } catch (error) {
    translatePrisma(error);
  }
}

/** Delete a node. Folders cascade-delete their entire subtree. */
export async function deleteNode(id: string) {
  if (id === ROOT_ID) throw new AppError(400, "Cannot delete the root folder");
  await findOrThrow(id);
  await prisma.node.delete({ where: { id } });
  return { id, deleted: true };
}

/** Fetch the raw bytes (or text) of a file for streaming back to the client. */
export async function getRaw(id: string) {
  const node = await prisma.node.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      type: true,
      content: true,
      data: true,
      mimeType: true,
    },
  });
  if (!node) throw new AppError(404, `Node not found: ${id}`);
  if (node.type !== NodeType.FILE)
    throw new AppError(400, "Only files have raw content");

  if (node.data) {
    return {
      kind: "binary" as const,
      name: node.name,
      mimeType: node.mimeType ?? "application/octet-stream",
      buffer: Buffer.from(node.data),
    };
  }
  return {
    kind: "text" as const,
    name: node.name,
    mimeType: node.mimeType ?? "text/plain; charset=utf-8",
    text: node.content ?? "",
  };
}

/** Search nodes by name or text content. Returns matches with their full path. */
export async function search(query: string) {
  const term = query.trim();
  if (!term) return [];

  const matches = await prisma.node.findMany({
    where: {
      id: { not: ROOT_ID },
      OR: [{ name: { contains: term } }, { content: { contains: term } }],
    },
    select: nodeSelect,
    take: 100,
  });

  const results = [];
  for (const node of matches.sort(sortNodes)) {
    const path = await buildPath(node);
    results.push({
      ...toPublic(node),
      path,
      // Human-readable path, root folder name omitted: "/Documents/notes.md"
      pathString:
        "/" +
        path
          .slice(1)
          .map((p) => p.name)
          .join("/"),
    });
  }
  return results;
}
