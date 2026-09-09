import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateUserStreak } from '@/lib/streak';
import { getRankFromPoints, POINT_REWARDS } from '@/lib/rankSystem';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const communityId = searchParams.get('communityId');

    const blogs = await prisma.blog.findMany({
      where: communityId ? { communityId } : undefined,
      include: {
        author: true,
        comments: {
          include: {
            author: true,
            reactions: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        reactions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Check saved items for user if userId passed
    let savedBlogIds: string[] = [];
    if (userId) {
      const savedItems = await prisma.savedItem.findMany({
        where: { userId, itemType: 'blog' },
      });
      savedBlogIds = savedItems.map((s) => s.itemId).filter(Boolean) as string[];
    }

    const formattedBlogs = blogs.map((blog) => {
      const isLikedByMe = userId ? blog.reactions.some((r) => r.userId === userId) : false;
      const isSavedByMe = savedBlogIds.includes(blog.id);

      const allComments = (blog.comments || []).map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt ? c.updatedAt.toISOString() : c.createdAt.toISOString(),
        likesCount: c.reactions ? c.reactions.length : 0,
        isLikedByMe: userId && c.reactions ? c.reactions.some((r) => r.userId === userId) : false,
      }));

      const topLevelComments = allComments.filter((c) => !c.parentId);
      const formattedComments = topLevelComments.map((parent) => ({
        ...parent,
        replies: allComments.filter((c) => c.parentId === parent.id),
      }));

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

    return NextResponse.json({ blogs: formattedBlogs });
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
        author: true,
        comments: { include: { author: true, reactions: true } },
        reactions: true,
      },
    });

    // Recalculate dynamic active streak and update user points in parallel
    Promise.all([
      calculateUserStreak(authorId),
      prisma.user.findUnique({ where: { id: authorId } }),
    ]).then(([newStreak, authorUser]) => {
      const updatedPoints = (authorUser?.totalPoints || 0) + POINT_REWARDS.BLOG_CREATED;
      const updatedRank = getRankFromPoints(updatedPoints);
      return prisma.user.update({
        where: { id: authorId },
        data: {
          activeStreak: newStreak,
          totalPoints: updatedPoints,
          rank: updatedRank,
        },
      });
    }).catch((e) => console.error('Background blog point update error:', e));

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
