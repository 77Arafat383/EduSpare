import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { userId, type = 'like' } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const existingReaction = await prisma.reaction.findUnique({
      where: {
        blogId_userId: {
          blogId: params.id,
          userId,
        },
      },
    });

    if (existingReaction) {
      // Toggle off if clicking same
      await prisma.reaction.delete({
        where: { id: existingReaction.id },
      });
      return NextResponse.json({ action: 'removed' });
    } else {
      const reaction = await prisma.reaction.create({
        data: {
          blogId: params.id,
          userId,
          type,
        },
      });
      return NextResponse.json({ action: 'added', reaction });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update reaction' }, { status: 500 });
  }
}
