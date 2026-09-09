import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorSelect } from '@/lib/apiResponse';

export async function PUT(
  request: Request,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const body = await request.json();
    const { authorId, content } = body;

    if (!authorId || !content) {
      return NextResponse.json({ error: 'Author ID and content required' }, { status: 400 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: params.commentId },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (comment.authorId !== authorId) {
      return NextResponse.json({ error: 'Unauthorized to update this comment' }, { status: 403 });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: params.commentId },
      data: { content },
      include: { author: { select: authorSelect } },
    });

    return NextResponse.json({
      comment: {
        ...updatedComment,
        createdAt: updatedComment.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Update comment error:', error);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: params.commentId },
      include: { blog: true },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const isCommentAuthor = comment.authorId === userId;
    const isBlogAuthor = comment.blog.authorId === userId;

    if (!isCommentAuthor && !isBlogAuthor) {
      return NextResponse.json({ error: 'Unauthorized to delete this comment' }, { status: 403 });
    }

    await prisma.comment.delete({
      where: { id: params.commentId },
    });

    return NextResponse.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
