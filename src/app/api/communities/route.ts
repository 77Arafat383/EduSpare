import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const communities = await prisma.community.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      communities: communities.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        tags: JSON.parse(c.tags || '[]'),
        memberIds: JSON.parse(c.memberIds || '[]'),
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch communities' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, userId, name, description, image, tags, isPrivate, communityId } = body;

    if (action === 'create') {
      if (!name || !description || !createdById(body)) {
        return NextResponse.json({ error: 'Missing community name, description, or creator' }, { status: 400 });
      }

      const createdByIdVal = body.createdById || userId;
      const newCommunity = await prisma.community.create({
        data: {
          name,
          description,
          image: image || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
          tags: typeof tags === 'string' ? tags : JSON.stringify(tags || []),
          isPrivate: !!isPrivate,
          memberIds: JSON.stringify([createdByIdVal]),
          createdById: createdByIdVal,
        },
      });

      return NextResponse.json({
        community: {
          ...newCommunity,
          createdAt: newCommunity.createdAt.toISOString(),
          tags: JSON.parse(newCommunity.tags || '[]'),
          memberIds: JSON.parse(newCommunity.memberIds || '[]'),
        },
      });
    }

    if (action === 'join' || action === 'leave') {
      const community = await prisma.community.findUnique({ where: { id: communityId } });
      if (!community) {
        return NextResponse.json({ error: 'Community not found' }, { status: 404 });
      }

      let members: string[] = JSON.parse(community.memberIds || '[]');
      if (action === 'join' && !members.includes(userId)) {
        members.push(userId);
      } else if (action === 'leave') {
        members = members.filter((id) => id !== userId);
      }

      const updated = await prisma.community.update({
        where: { id: communityId },
        data: { memberIds: JSON.stringify(members) },
      });

      return NextResponse.json({
        community: {
          ...updated,
          createdAt: updated.createdAt.toISOString(),
          tags: JSON.parse(updated.tags || '[]'),
          memberIds: members,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process community action' }, { status: 500 });
  }
}

function createdById(body: any): string {
  return body.createdById || body.userId;
}
