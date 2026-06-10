import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function ensureFolder(name: string, parentId: string) {
  return prisma.node.upsert({
    where: { parentId_name: { parentId, name } },
    update: {},
    create: { name, type: 'FOLDER', parentId },
  });
}

async function ensureFile(name: string, parentId: string, content: string) {
  return prisma.node.upsert({
    where: { parentId_name: { parentId, name } },
    update: {},
    create: { name, type: 'FILE', parentId, content },
  });
}

async function main() {
  // The single root folder (fixed id so the API/UI can always reach it).
  const root = await prisma.node.upsert({
    where: { id: 'root' },
    update: {},
    create: { id: 'root', name: 'root', type: 'FOLDER', parentId: null },
  });

  const documents = await ensureFolder('Documents', root.id);
  const pictures = await ensureFolder('Pictures', root.id);
  await ensureFolder('Projects', root.id);

  await ensureFile('readme.txt', root.id, 'Welcome to the pseudo file system!\nEdit me through the API.');
  await ensureFile('notes.md', documents.id, '# Notes\n\n- A virtual file.\n- Stored in SQLite via Prisma.');
  await ensureFile('todo.md', documents.id, '# TODO\n\n- [x] Build the API\n- [ ] Build the frontend');
  await ensureFile('caption.txt', pictures.id, '(pretend this is a photo)');

  console.log('Seed complete.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
