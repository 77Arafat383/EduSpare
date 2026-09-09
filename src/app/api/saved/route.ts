import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonWithEtag } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const savedItems = await prisma.savedItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return jsonWithEtag(request, { savedItems });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch saved items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, itemType, itemId, title, url, meta } = body;

    if (!userId || !title) {
      return NextResponse.json({ error: 'userId and title required' }, { status: 400 });
    }

    const existing = await prisma.savedItem.findFirst({
      where: {
        userId,
        title,
      },
    });

    if (existing) {
      await prisma.savedItem.delete({ where: { id: existing.id } });
      return NextResponse.json({ action: 'removed', id: existing.id });
    }

    const saved = await prisma.savedItem.create({
      data: {
        userId,
        itemType: itemType || 'blog',
        itemId: itemId || null,
        title,
        url: url || '',
        meta: meta || '',
      },
    });

    return NextResponse.json({ action: 'saved', item: saved });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save item' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await prisma.savedItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete saved item' }, { status: 500 });
  }
}
