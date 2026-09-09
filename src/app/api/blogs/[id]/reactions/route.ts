import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

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

    const [blog, existingReaction] = await Promise.all([
      prisma.blog.findUnique({
        where: { id: params.id },
        select: { id: true, authorId: true, title: true },
      }),
      prisma.reaction.findUnique({
        where: {
          blogId_userId: {
            blogId: params.id,
            userId,
          },
        },
      }),
    ]);

    if (existingReaction) {
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

      if (blog && blog.authorId !== userId) {
        const actor = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
        if (actor) {
          await createNotification({
            userId: blog.authorId,
            actorId: userId,
            type: 'reaction',
            title: `@${actor.username} liked your post "${blog.title.slice(0, 40)}"`,
            linkId: params.id,
          });
        }
      }

      return NextResponse.json({ action: 'added', reaction });
    }
  } catch (error) {
    console.error('Reaction update error:', error);
    return NextResponse.json({ error: 'Failed to update reaction' }, { status: 500 });
  }
}
