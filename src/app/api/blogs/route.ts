import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateUserStreak } from '@/lib/streak';
import { getRankFromPoints, POINT_REWARDS } from '@/lib/rankSystem';
import { jsonWithEtag, authorSelect } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const communityId = searchParams.get('communityId');
    const limitParam = Number(searchParams.get('limit'));
    const take = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : undefined;

    const [blogs, savedItems] = await Promise.all([
      prisma.blog.findMany({
        where: communityId ? { communityId } : undefined,
        include: {
          author: { select: authorSelect },
          comments: {
            include: {
              author: { select: authorSelect },
              reactions: { select: { id: true, commentId: true, userId: true, type: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
          reactions: { select: { id: true, blogId: true, userId: true, type: true } },
        },
        orderBy: { createdAt: 'desc' },
        take,
      }),
      userId
        ? prisma.savedItem.findMany({
            where: { userId, itemType: 'blog' },
            select: { itemId: true },
          })
        : Promise.resolve([] as { itemId: string | null }[]),
    ]);

    // Check saved items for user if userId passed
    const savedBlogIds = new Set(savedItems.map((s) => s.itemId).filter(Boolean) as string[]);

    const formattedBlogs = blogs.map((blog) => {
      const isLikedByMe = userId ? blog.reactions.some((r) => r.userId === userId) : false;
      const isSavedByMe = savedBlogIds.has(blog.id);

      const allComments = (blog.comments || []).map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt ? c.updatedAt.toISOString() : c.createdAt.toISOString(),
        likesCount: c.reactions ? c.reactions.length : 0,
        isLikedByMe: userId && c.reactions ? c.reactions.some((r) => r.userId === userId) : false,
      }));

      const repliesByParent = new Map<string, typeof allComments>();
      allComments.forEach((c) => {
        if (!c.parentId) return;
        const list = repliesByParent.get(c.parentId) ?? [];
        list.push(c);
        repliesByParent.set(c.parentId, list);
      });
      const formattedComments = allComments
        .filter((c) => !c.parentId)
        .map((parent) => ({ ...parent, replies: repliesByParent.get(parent.id) ?? [] }));

      return {
        ...blog,
        createdAt: blog.createdAt.toISOString(),
        updatedAt: blog.updatedAt ? blog.updatedAt.toISOString() : blog.createdAt.toISOString(),
        attachments: JSON.parse(blog.attachments || '[]'),
        tags: JSON.parse(blog.tags || '[]'),
        comments: formattedComments,
        likesCount: blog.reactions.length,
        isLikedByMe,
        isSavedByMe,
      };
    });

    return jsonWithEtag(request, { blogs: formattedBlogs });
  } catch (error) {
    console.error('Fetch blogs error:', error);
    return NextResponse.json({ error: 'Failed to fetch blogs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { authorId, title, content, coverImage, attachments, tags, communityId } = body;

    if (!authorId || !title || !content) {
      return NextResponse.json({ error: 'Author, title, and content are required' }, { status: 400 });
    }

    const newBlog = await prisma.blog.create({
      data: {
        authorId,
        title,
        content,
        coverImage: coverImage || null,
        attachments: typeof attachments === 'string' ? attachments : JSON.stringify(attachments || []),
        tags: typeof tags === 'string' ? tags : JSON.stringify(tags || []),
        communityId: communityId || null,
      },
      include: {
        author: { select: authorSelect },
      },
    });

    // Recalculate dynamic active streak, reward points, and update rank
    const [newStreak, authorUser] = await Promise.all([
      calculateUserStreak(authorId),
      prisma.user.findUnique({ where: { id: authorId }, select: { totalPoints: true } }),
    ]);
    const updatedPoints = (authorUser?.totalPoints || 0) + POINT_REWARDS.BLOG_CREATED;
    const updatedRank = getRankFromPoints(updatedPoints);

    await prisma.user.update({
      where: { id: authorId },
      data: {
        activeStreak: newStreak,
        totalPoints: updatedPoints,
        rank: updatedRank,
      },
    });

    return NextResponse.json({
      blog: {
        ...newBlog,
        createdAt: newBlog.createdAt.toISOString(),
        updatedAt: newBlog.updatedAt ? newBlog.updatedAt.toISOString() : newBlog.createdAt.toISOString(),
        attachments: JSON.parse(newBlog.attachments || '[]'),
        tags: JSON.parse(newBlog.tags || '[]'),
        comments: [],
        reactions: [],
        likesCount: 0,
        isLikedByMe: false,
        isSavedByMe: false,
      },
    });
  } catch (error) {
    console.error('Blog create error:', error);
    return NextResponse.json({ error: 'Failed to create blog post' }, { status: 500 });
  }
}
