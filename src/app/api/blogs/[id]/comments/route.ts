import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { authorId, content } = body;

    if (!authorId || !content) {
      return NextResponse.json({ error: 'Author and content required' }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        blogId: params.id,
        authorId,
        content,
      },
      include: {
        author: true,
      },
    });

    return NextResponse.json({
      comment: {
        ...comment,
        createdAt: comment.createdAt.toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}
