import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { NodeType, ROOT_ID } from "../types/node.types";
import { AppError } from "../utils/AppError";

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
type Crumb = { id: string; name: string; parentId: string | null };

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

  const isBinary = node.content === null;
  return {
    ...base,
    isBinary,
    mimeType:
      node.mimeType ??
      (isBinary ? "application/octet-stream" : "text/plain; charset=utf-8"),
    size: node.size ?? (node.content ? Buffer.byteLength(node.content) : 0),
    rawUrl: `/api/nodes/${node.id}/raw`,
    ...(isBinary ? {} : { content: node.content ?? "" }),
  };
}

function sortNodes(a: NodeView, b: NodeView): number {
  if (a.type !== b.type) return a.type === NodeType.FOLDER ? -1 : 1;
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

async function getUserRoot(userId: string): Promise<NodeView> {
  const root = await prisma.node.findFirst({
    where: { ownerId: userId, parentId: null, type: NodeType.FOLDER },
    select: nodeSelect,
  });
  if (!root) throw new AppError(500, "Root folder not found");
  return root;
}

async function findOrThrow(userId: string, id: string): Promise<NodeView> {
  if (id === ROOT_ID) return getUserRoot(userId);

  const node = await prisma.node.findFirst({
    where: { id, ownerId: userId },
    select: nodeSelect,
  });
  if (!node) throw new AppError(404, `Node not found: ${id}`);
  return node;
}

async function assertFolder(userId: string, id: string): Promise<NodeView> {
  const node = await findOrThrow(userId, id);
  if (node.type !== NodeType.FOLDER) {
    throw new AppError(400, `Node is not a folder: ${id}`);
  }
  return node;
}

async function assertNameAvailable(
  userId: string,
  parentId: string,
  name: string,
  excludeId?: string,
): Promise<void> {
  const clash = await prisma.node.findFirst({
    where: {
      ownerId: userId,
      parentId,
      name,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });
  if (clash) throw new AppError(409, `"${name}" already exists in this folder`);
}

async function buildPath(
  userId: string,
  node: Crumb,
): Promise<Array<{ id: string; name: string }>> {
  const path: Array<{ id: string; name: string }> = [];
  let current: Crumb | null = node;

  while (current) {
    path.unshift({ id: current.id, name: current.name });
    if (!current.parentId) break;
    current = await prisma.node.findFirst({
      where: { id: current.parentId, ownerId: userId },
      select: { id: true, name: true, parentId: true },
    });
    if (!current) throw new AppError(404, "Parent node not found");
  }

  return path;
}

async function isDescendantOf(
  userId: string,
  candidateId: string,
  ancestorId: string,
): Promise<boolean> {
  let current = await prisma.node.findFirst({
    where: { id: candidateId, ownerId: userId },
    select: { id: true, parentId: true },
  });

  while (current && current.parentId) {
    if (current.parentId === ancestorId) return true;
    current = await prisma.node.findFirst({
      where: { id: current.parentId, ownerId: userId },
      select: { id: true, parentId: true },
    });
  }
  return false;
}

function translatePrisma(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new AppError(
        409,
        "A node with this name already exists in this folder",
      );
    }
    if (error.code === "P2025") throw new AppError(404, "Node not found");
  }
  throw error;
}

export async function getTree(userId: string) {
  const all = await prisma.node.findMany({
    where: { ownerId: userId },
    select: nodeSelect,
  });
  const root = all.find(
    (node) => node.parentId === null && node.type === NodeType.FOLDER,
  );
  if (!root) throw new AppError(500, "Root folder not found");

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

  return build(root);
}

export async function getNode(userId: string, id: string) {
  const node = await findOrThrow(userId, id);
  const path = await buildPath(userId, node);

  let children: ReturnType<typeof toPublic>[] | undefined;
  if (node.type === NodeType.FOLDER) {
    const kids = await prisma.node.findMany({
      where: { ownerId: userId, parentId: node.id },
      select: nodeSelect,
    });
    children = kids.sort(sortNodes).map(toPublic);
  }

  return { ...toPublic(node), path, children };
}

export async function createNode(
  userId: string,
  input: { name: string; type: NodeType; parentId?: string; content?: string },
) {
  const parent = await assertFolder(userId, input.parentId ?? ROOT_ID);
  await assertNameAvailable(userId, parent.id, input.name);

  const isFile = input.type === NodeType.FILE;
  try {
    const created = await prisma.node.create({
      data: {
        name: input.name,
        type: input.type,
        ownerId: userId,
        parentId: parent.id,
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

export async function uploadNode(
  userId: string,
  input: { name: string; parentId?: string; mimeType: string; buffer: Buffer },
) {
  const parent = await assertFolder(userId, input.parentId ?? ROOT_ID);
  const name = input.name.trim();
  if (!name) throw new AppError(400, "File name is required");
  if (name.includes("/")) throw new AppError(400, 'name cannot contain "/"');
  await assertNameAvailable(userId, parent.id, name);

  try {
    const created = await prisma.node.create({
      data: {
        name,
        type: NodeType.FILE,
        ownerId: userId,
        parentId: parent.id,
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

export async function updateNode(
  userId: string,
  id: string,
  input: { name?: string; content?: string },
) {
  const node = await findOrThrow(userId, id);
  if (node.parentId === null) {
    throw new AppError(400, "Cannot update the root folder");
  }

  const data: Prisma.NodeUpdateInput = {};
  if (input.name !== undefined && input.name !== node.name) {
    await assertNameAvailable(userId, node.parentId, input.name, node.id);
    data.name = input.name;
  }

  if (input.content !== undefined) {
    if (node.type !== NodeType.FILE) {
      throw new AppError(400, "Only files can have content");
    }
    if (node.content === null) {
      throw new AppError(400, "Cannot edit a binary file as text");
    }
    data.content = input.content;
    data.size = Buffer.byteLength(input.content);
  }

  if (Object.keys(data).length === 0) return toPublic(node);

  try {
    const updated = await prisma.node.update({
      where: { id: node.id },
      data,
      select: nodeSelect,
    });
    return toPublic(updated);
  } catch (error) {
    translatePrisma(error);
  }
}

export async function moveNode(
  userId: string,
  id: string,
  newParentId: string,
) {
  const node = await findOrThrow(userId, id);
  if (node.parentId === null) {
    throw new AppError(400, "Cannot move the root folder");
  }

  const newParent = await assertFolder(userId, newParentId);
  if (newParent.id === node.id) {
    throw new AppError(400, "Cannot move a node into itself");
  }
  if (await isDescendantOf(userId, newParent.id, node.id)) {
    throw new AppError(
      400,
      "Cannot move a folder into one of its own descendants",
    );
  }
  if (newParent.id !== node.parentId) {
    await assertNameAvailable(userId, newParent.id, node.name, node.id);
  }

  try {
    const updated = await prisma.node.update({
      where: { id: node.id },
      data: { parentId: newParent.id },
      select: nodeSelect,
    });
    return toPublic(updated);
  } catch (error) {
    translatePrisma(error);
  }
}

export async function deleteNode(userId: string, id: string) {
  const node = await findOrThrow(userId, id);
  if (node.parentId === null) {
    throw new AppError(400, "Cannot delete the root folder");
  }
  await prisma.node.delete({ where: { id: node.id } });
  return { id: node.id, deleted: true };
}

export async function getRaw(userId: string, id: string) {
  const node = await prisma.node.findFirst({
    where: { id, ownerId: userId },
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
  if (node.type !== NodeType.FILE) {
    throw new AppError(400, "Only files have raw content");
  }

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

export async function search(userId: string, query: string) {
  const term = query.trim();
  if (!term) return [];

  const matches = await prisma.node.findMany({
    where: {
      ownerId: userId,
      parentId: { not: null },
      OR: [{ name: { contains: term } }, { content: { contains: term } }],
    },
    select: nodeSelect,
    take: 100,
  });

  const results = [];
  for (const node of matches.sort(sortNodes)) {
    const path = await buildPath(userId, node);
    results.push({
      ...toPublic(node),
      path,
      pathString:
        "/" +
        path
          .slice(1)
          .map((part) => part.name)
          .join("/"),
    });
  }
  return results;
}
