import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorSelect } from '@/lib/apiResponse';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const lowerQuery = query.toLowerCase();

    // Run all searches in parallel
    const [users, blogs, tasks, communities] = await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: lowerQuery } },
          { name: { contains: lowerQuery } },
          { bio: { contains: lowerQuery } },
        ],
      },
      take: 4,
      select: authorSelect,
    }),
    prisma.blog.findMany({
      where: {
        OR: [
          { title: { contains: lowerQuery } },
          { tags: { contains: lowerQuery } },
          { content: { contains: lowerQuery } },
        ],
      },
      select: { id: true, title: true, tags: true, content: true, coverImage: true, createdAt: true, author: { select: authorSelect } },
      take: 4,
    }),
    prisma.task.findMany({
      where: {
        OR: [
          { title: { contains: lowerQuery } },
          { category: { contains: lowerQuery } },
        ],
      },
      take: 3,
    }),
    prisma.community.findMany({
      where: {
        OR: [
          { name: { contains: lowerQuery } },
          { tags: { contains: lowerQuery } },
          { description: { contains: lowerQuery } },
        ],
      },
      take: 3,
    }),
    ]);

    const recommendations = [
      ...users.map((u) => ({
        type: 'user' as const,
        id: u.id,
        title: u.name,
        subtitle: `@${u.username} • ${u.university || 'Scholar'}`,
        avatar: u.avatar,
        link: `/profile?username=${u.username}`,
        raw: u,
      })),
      ...blogs.map((b) => ({
        type: 'blog' as const,
        id: b.id,
        title: b.title,
        subtitle: `Blog by ${b.author.name} • ${JSON.parse(b.tags || '[]').join(', ')}`,
        avatar: b.coverImage || b.author.avatar,
        link: `/blog?post=${b.id}`,
        raw: b,
      })),
      ...tasks.map((t) => ({
        type: 'task' as const,
        id: t.id,
        title: t.title,
        subtitle: `Task (${t.category}) • Priority ${t.importance}/100`,
        link: `/tasks?id=${t.id}`,
        raw: t,
      })),
      ...communities.map((c) => ({
        type: 'community' as const,
        id: c.id,
        title: c.name,
        subtitle: `Community • ${c.description.substring(0, 60)}...`,
        avatar: c.image,
        link: `/communities?id=${c.id}`,
        raw: c,
      })),
    ];

    return NextResponse.json({ results: recommendations });
  } catch (error) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
