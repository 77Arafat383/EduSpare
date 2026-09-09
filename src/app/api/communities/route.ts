import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseCommunityMeta, encodeCommunityMeta } from '@/lib/communityHelpers';

export async function GET() {
  try {
    const communities = await prisma.community.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      communities: communities.map((c) => parseCommunityMeta(c)),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch communities' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      image,
      avatarImage,
      rules,
      tags,
      isPrivate,
      createdById,
      userId,
    } = body;

    const creatorId = createdById || userId;

    if (!name || !description || !creatorId) {
      return NextResponse.json({ error: 'Missing community name, description, or creator' }, { status: 400 });
    }

    const tagsList = typeof tags === 'string' ? [tags] : tags || [];
    const tagsPayload = encodeCommunityMeta('[]', {
      tagsList,
      avatarImage: avatarImage || image || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
      rules: rules || null,
      adminIds: [creatorId],
      pendingRequestIds: [],
      invitedUserIds: [],
    });

    const newCommunity = await prisma.community.create({
      data: {
        name,
        description,
        image: image || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
        tags: tagsPayload,
        isPrivate: !!isPrivate,
        memberIds: JSON.stringify([creatorId]),
        createdById: creatorId,
      },
    });

    return NextResponse.json({
      community: parseCommunityMeta(newCommunity),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create community' }, { status: 500 });
  }
}
