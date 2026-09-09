import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorSelect } from '@/lib/apiResponse';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, content, coverImage, attachments, tags } = body;

    const updated = await prisma.blog.update({
      where: { id: params.id },
      data: {
        title,
        content,
        coverImage,
        attachments: typeof attachments === 'string' ? attachments : JSON.stringify(attachments || []),
        tags: typeof tags === 'string' ? tags : JSON.stringify(tags || []),
      },
      include: {
        author: { select: authorSelect },
        comments: { include: { author: { select: authorSelect } } },
        reactions: true,
      },
    });

    return NextResponse.json({
      blog: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        attachments: JSON.parse(updated.attachments || '[]'),
        tags: JSON.parse(updated.tags || '[]'),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update blog' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.blog.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true, id: params.id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete blog' }, { status: 500 });
  }
}
