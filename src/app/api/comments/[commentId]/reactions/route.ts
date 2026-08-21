import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { commentId: string } }
) {
  try {
    const body = await request.json();
    const { userId, type = 'like' } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const existing = await prisma.commentReaction.findUnique({
      where: {
        commentId_userId: {
          commentId: params.commentId,
          userId,
        },
      },
    });

    if (existing) {
      await prisma.commentReaction.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ success: true, action: 'removed' });
    } else {
      const newReaction = await prisma.commentReaction.create({
        data: {
          commentId: params.commentId,
          userId,
          type,
        },
      });
      return NextResponse.json({ success: true, action: 'added', reaction: newReaction });
    }
  } catch (error) {
    console.error('Comment reaction error:', error);
    return NextResponse.json({ error: 'Failed to update comment reaction' }, { status: 500 });
  }
}
