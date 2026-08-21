import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    console.error('Create comment error:', error);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}
