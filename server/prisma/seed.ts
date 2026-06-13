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
    where: { email: "takaki@email.com" },
    update: {},
    create: { username: "Takaki", email: "takaki@email.com", passwordHash },
  });

  const root =
    (await prisma.node.findFirst({
      where: { ownerId: user.id, parentId: null, type: "FOLDER" },
    })) ??
    (await prisma.node.create({
      data: { ownerId: user.id, name: "root", type: "FOLDER", parentId: null },
    }));

  const documents = await ensureFolder(user.id, "Documents", root.id);
  const pictures = await ensureFolder(user.id, "Pictures", root.id);
  const projects = await ensureFolder(user.id, "Projects", root.id);
  const personal = await ensureFolder(user.id, "Personal", documents.id);
  const work = await ensureFolder(user.id, "Work", documents.id);
  const website = await ensureFolder(user.id, "Portfolio Website", projects.id);
  const archive = await ensureFolder(user.id, "Archive", root.id);

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
  await ensureFile(
    user.id,
    "welcome.md",
    root.id,
    "# Welcome\n\nThis demo workspace contains sample folders and text files to explore.",
  );
  await ensureFile(
    user.id,
    "shopping-list.txt",
    personal.id,
    "Coffee\nBread\nEggs\nFresh fruit\nPasta",
  );
  await ensureFile(
    user.id,
    "travel-ideas.md",
    personal.id,
    "# Travel Ideas\n\n- Vancouver Island\n- Kyoto\n- Banff\n- New York City",
  );
  await ensureFile(
    user.id,
    "meeting-notes.md",
    work.id,
    "# Weekly Meeting\n\n- Review current progress\n- Prepare the demo\n- Plan next milestones",
  );
  await ensureFile(
    user.id,
    "project-brief.txt",
    work.id,
    "Goal: Build a simple and friendly cloud file manager demo.\n\nAudience: Students and instructors.",
  );
  await ensureFile(
    user.id,
    "README.md",
    projects.id,
    "# Projects\n\nThis folder contains active demo projects and their documentation.",
  );
  await ensureFile(
    user.id,
    "design-notes.md",
    website.id,
    "# Design Notes\n\nUse generous spacing, clear typography, and a calm blue color palette.",
  );
  await ensureFile(
    user.id,
    "content-plan.txt",
    website.id,
    "Home\nAbout\nSelected projects\nContact",
  );
  await ensureFile(
    user.id,
    "ideas.txt",
    projects.id,
    "File tagging\nShared folders\nFavorite files\nRecent activity",
  );
  await ensureFile(
    user.id,
    "2025-summary.md",
    archive.id,
    "# 2025 Summary\n\nA small archived document included for the file browser demo.",
  );

  console.log("Seed complete for takaki@email.com");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
