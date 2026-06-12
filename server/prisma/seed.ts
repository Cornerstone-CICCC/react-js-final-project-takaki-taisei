import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function ensureFolder(ownerId: string, name: string, parentId: string) {
  return prisma.node.upsert({
    where: { ownerId_parentId_name: { ownerId, parentId, name } },
    update: {},
    create: { ownerId, name, type: "FOLDER", parentId },
  });
}

async function ensureFile(
  ownerId: string,
  name: string,
  parentId: string,
  content: string,
) {
  return prisma.node.upsert({
    where: { ownerId_parentId_name: { ownerId, parentId, name } },
    update: {},
    create: {
      ownerId,
      name,
      type: "FILE",
      parentId,
      content,
      size: Buffer.byteLength(content),
    },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      username: "Demo User",
      email: "demo@example.com",
      passwordHash,
    },
  });

  const root =
    (await prisma.node.findFirst({
      where: { ownerId: user.id, parentId: null, type: "FOLDER" },
    })) ??
    (await prisma.node.create({
      data: {
        ownerId: user.id,
        name: "root",
        type: "FOLDER",
        parentId: null,
      },
    }));

  const documents = await ensureFolder(user.id, "Documents", root.id);
  const pictures = await ensureFolder(user.id, "Pictures", root.id);
  await ensureFolder(user.id, "Projects", root.id);

  await ensureFile(
    user.id,
    "readme.txt",
    root.id,
    "Welcome to the pseudo file system!\nEdit me through the API.",
  );
  await ensureFile(
    user.id,
    "notes.md",
    documents.id,
    "# Notes\n\n- A virtual file.\n- Stored in SQLite via Prisma.",
  );
  await ensureFile(
    user.id,
    "todo.md",
    documents.id,
    "# TODO\n\n- [x] Build the API\n- [ ] Build the frontend",
  );
  await ensureFile(
    user.id,
    "caption.txt",
    pictures.id,
    "(pretend this is a photo)",
  );

  console.log("Seed complete. Demo login: demo@example.com / password123");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
