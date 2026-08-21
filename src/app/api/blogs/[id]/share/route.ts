import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const count = typeof body.count === 'number' ? body.count : 1;

    const updatedBlog = await prisma.blog.update({
      where: { id: params.id },
      data: {
        sharesCount: { increment: count },
      },
    });

    return NextResponse.json({ success: true, sharesCount: updatedBlog.sharesCount });
  } catch (error) {
    console.error('Increment share count error:', error);
    return NextResponse.json({ error: 'Failed to update share count' }, { status: 500 });
  }
}
