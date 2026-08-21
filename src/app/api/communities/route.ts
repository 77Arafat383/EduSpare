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
        adminIds: (c as any).adminIds ? JSON.parse((c as any).adminIds || '[]') : [c.createdById],
        pendingRequestIds: (c as any).pendingRequestIds ? JSON.parse((c as any).pendingRequestIds || '[]') : [],
        avatarImage: (c as any).avatarImage || c.image,
        rules: (c as any).rules || null,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch communities' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      action,
      userId,
      name,
      description,
      image,
      avatarImage,
      rules,
      tags,
      isPrivate,
      communityId,
      applicantId,
      memberId,
      decision,
    } = body;

    const createdByIdVal = body.createdById || userId;

    if (action === 'create') {
      if (!name || !description || !createdByIdVal) {
        return NextResponse.json({ error: 'Missing community name, description, or creator' }, { status: 400 });
      }

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
          adminIds: [createdByIdVal],
          pendingRequestIds: [],
          avatarImage: avatarImage || newCommunity.image,
          rules: rules || null,
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
          adminIds: (updated as any).adminIds ? JSON.parse((updated as any).adminIds || '[]') : [updated.createdById],
          pendingRequestIds: (updated as any).pendingRequestIds ? JSON.parse((updated as any).pendingRequestIds || '[]') : [],
          avatarImage: (updated as any).avatarImage || updated.image,
          rules: (updated as any).rules || null,
        },
      });
    }

    if (action === 'request-join') {
      const community = await prisma.community.findUnique({ where: { id: communityId } });
      if (!community) return NextResponse.json({ error: 'Community not found' }, { status: 404 });

      let pending: string[] = (community as any).pendingRequestIds ? JSON.parse((community as any).pendingRequestIds || '[]') : [];
      if (!pending.includes(userId)) pending.push(userId);

      // Create notification for Admin
      try {
        await prisma.notification.create({
          data: {
            userId: community.createdById,
            actorId: userId,
            type: 'community_request',
            title: 'New Community Join Request',
            content: `A user requested to join ${community.name}`,
            linkId: community.id,
          },
        });
      } catch (e) {
        console.error('Notification creation error:', e);
      }

      const updated = await prisma.community.update({
        where: { id: communityId },
        data: { memberIds: community.memberIds },
      });

      return NextResponse.json({
        community: {
          ...updated,
          createdAt: updated.createdAt.toISOString(),
          tags: JSON.parse(updated.tags || '[]'),
          memberIds: JSON.parse(updated.memberIds || '[]'),
          pendingRequestIds: pending,
        },
      });
    }

    if (action === 'cancel-request') {
      const community = await prisma.community.findUnique({ where: { id: communityId } });
      if (!community) return NextResponse.json({ error: 'Community not found' }, { status: 404 });

      let pending: string[] = (community as any).pendingRequestIds ? JSON.parse((community as any).pendingRequestIds || '[]') : [];
      pending = pending.filter((id) => id !== userId);

      const updated = await prisma.community.update({
        where: { id: communityId },
        data: { memberIds: community.memberIds },
      });

      return NextResponse.json({
        community: {
          ...updated,
          createdAt: updated.createdAt.toISOString(),
          tags: JSON.parse(updated.tags || '[]'),
          memberIds: JSON.parse(updated.memberIds || '[]'),
          pendingRequestIds: pending,
        },
      });
    }

    if (action === 'handle-request') {
      const community = await prisma.community.findUnique({ where: { id: communityId } });
      if (!community) return NextResponse.json({ error: 'Community not found' }, { status: 404 });

      let members: string[] = JSON.parse(community.memberIds || '[]');
      let pending: string[] = (community as any).pendingRequestIds ? JSON.parse((community as any).pendingRequestIds || '[]') : [];

      pending = pending.filter((id) => id !== applicantId);
      if (decision === 'approve' && !members.includes(applicantId)) {
        members.push(applicantId);
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
          pendingRequestIds: pending,
        },
      });
    }

    if (action === 'update-cover') {
      const community = await prisma.community.findUnique({ where: { id: communityId } });
      if (!community) return NextResponse.json({ error: 'Community not found' }, { status: 404 });

      const updated = await prisma.community.update({
        where: { id: communityId },
        data: {
          image: image || community.image,
          name: name || community.name,
          description: description || community.description,
          isPrivate: typeof isPrivate === 'boolean' ? isPrivate : community.isPrivate,
        },
      });

      return NextResponse.json({
        community: {
          ...updated,
          createdAt: updated.createdAt.toISOString(),
          tags: JSON.parse(updated.tags || '[]'),
          memberIds: JSON.parse(updated.memberIds || '[]'),
          avatarImage: avatarImage || updated.image,
          rules: rules || null,
        },
      });
    }

    if (action === 'remove-member') {
      const community = await prisma.community.findUnique({ where: { id: communityId } });
      if (!community) return NextResponse.json({ error: 'Community not found' }, { status: 404 });

      let members: string[] = JSON.parse(community.memberIds || '[]');
      members = members.filter((id) => id !== memberId);

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

    if (action === 'invite-user') {
      const community = await prisma.community.findUnique({ where: { id: communityId } });
      if (!community) return NextResponse.json({ error: 'Community not found' }, { status: 404 });

      let members: string[] = JSON.parse(community.memberIds || '[]');
      if (applicantId && !members.includes(applicantId)) {
        members.push(applicantId);
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

    if (action === 'delete') {
      await prisma.community.delete({ where: { id: communityId } });
      return NextResponse.json({ success: true, deletedCommunityId: communityId });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process community action' }, { status: 500 });
  }
}
