import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorSelect } from '@/lib/apiResponse';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId parameter required' }, { status: 400 });
    }

    const blocks = await prisma.userBlock.findMany({
      where: { blockerId: userId },
      include: { blocked: { select: authorSelect } },
    });

    return NextResponse.json({ blocks: blocks.map((b) => b.blocked) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch blocklist' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { blockerId, blockedId } = body;

    if (!blockerId || !blockedId) {
      return NextResponse.json({ error: 'blockerId and blockedId required' }, { status: 400 });
    }

    const block = await prisma.userBlock.upsert({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
      update: {},
      create: {
        blockerId,
        blockedId,
      },
    });

    return NextResponse.json({ success: true, block });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to block user' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const blockerId = searchParams.get('blockerId');
    const blockedId = searchParams.get('blockedId');

    if (!blockerId || !blockedId) {
      return NextResponse.json({ error: 'blockerId and blockedId parameters required' }, { status: 400 });
    }

    await prisma.userBlock.deleteMany({
      where: {
        blockerId,
        blockedId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to unblock user' }, { status: 500 });
  }
}
