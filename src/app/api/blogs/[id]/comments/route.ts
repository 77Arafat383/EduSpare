import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorSelect } from '@/lib/apiResponse';
import { createNotification, notifyMentions } from '@/lib/notifications';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { authorId, content, parentId } = body;

    if (!authorId || !content) {
      return NextResponse.json({ error: 'Author and content required' }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        blogId: params.id,
        authorId,
        content,
        parentId: parentId || null,
      },
      include: {
        author: { select: authorSelect },
        blog: true,
      },
    });

    // Notify @mentions in comment text
    await notifyMentions({ content, actorId: authorId, linkId: params.id });

    // Notify blog post author if comment is from another user
    if (comment.blog && comment.blog.authorId !== authorId) {
      await createNotification({
        userId: comment.blog.authorId,
        actorId: authorId,
        type: 'comment',
        title: `@${comment.author.username} commented on "${comment.blog.title}"`,
        content: content.slice(0, 100),
        linkId: params.id,
      });
    }

    return NextResponse.json({
      comment: {
        ...comment,
        createdAt: comment.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}
