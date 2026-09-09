import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseCommunityMeta } from '@/lib/communityHelpers';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const communityId = params.id;
    const body = await request.json();
    const { action, userId, memberId } = body;

    const community = await prisma.community.findUnique({ where: { id: communityId } });
    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    let members: string[] = JSON.parse(community.memberIds || '[]');

    if (action === 'join' && !members.includes(userId)) {
      members.push(userId);
    } else if (action === 'leave') {
      members = members.filter((id) => id !== userId);
    } else if (action === 'remove-member') {
      members = members.filter((id) => id !== memberId);
    } else {
      return NextResponse.json({ error: 'Invalid member action' }, { status: 400 });
    }

    const updated = await prisma.community.update({
      where: { id: communityId },
      data: { memberIds: JSON.stringify(members) },
    });

    return NextResponse.json({
      community: parseCommunityMeta(updated),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process member action' }, { status: 500 });
  }
}
