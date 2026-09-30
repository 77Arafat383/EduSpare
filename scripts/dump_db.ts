import * as fs from 'fs';
import { prisma } from '../src/lib/prisma';

async function main() {
  const [users, tasks, blogs, communities, comments, messages] = await Promise.all([
    prisma.user.findMany(),
    prisma.task.findMany(),
    prisma.blog.findMany(),
    prisma.community.findMany(),
    prisma.comment.findMany(),
    prisma.message.findMany(),
  ]);

  const data = {
    users,
    tasks,
    blogs,
    communities,
    comments,
    messages,
  };

  fs.writeFileSync('scripts/db_snapshot.json', JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Saved snapshot: ${users.length} users, ${tasks.length} tasks, ${blogs.length} blogs, ${communities.length} communities`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
