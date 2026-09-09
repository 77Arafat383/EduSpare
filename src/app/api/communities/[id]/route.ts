import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseCommunityMeta, encodeCommunityMeta } from '@/lib/communityHelpers';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const communityId = params.id;
    const body = await request.json();
    const { name, description, image, avatarImage, rules, isPrivate } = body;

    const community = await prisma.community.findUnique({ where: { id: communityId } });
    if (!community) return NextResponse.json({ error: 'Community not found' }, { status: 404 });

    const parsedMeta = parseCommunityMeta(community);
    const newTags = encodeCommunityMeta(community.tags, {
      avatarImage: avatarImage !== undefined ? avatarImage : parsedMeta.avatarImage,
      rules: rules !== undefined ? rules : parsedMeta.rules,
    });

    const updated = await prisma.community.update({
      where: { id: communityId },
      data: {
        image: image || community.image,
        name: name || community.name,
        description: description || community.description,
        isPrivate: typeof isPrivate === 'boolean' ? isPrivate : community.isPrivate,
        tags: newTags,
      },
    });

    return NextResponse.json({
      community: parseCommunityMeta(updated),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update community' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const communityId = params.id;
    await prisma.community.delete({ where: { id: communityId } });
    return NextResponse.json({ success: true, deletedCommunityId: communityId });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete community' }, { status: 500 });
  }
}
