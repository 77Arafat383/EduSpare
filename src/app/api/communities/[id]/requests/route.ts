import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseCommunityMeta, encodeCommunityMeta } from '@/lib/communityHelpers';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const communityId = params.id;
    const body = await request.json();
    const { action, userId, applicantId, targetUserId, decision } = body;

    const community = await prisma.community.findUnique({ where: { id: communityId } });
    if (!community) return NextResponse.json({ error: 'Community not found' }, { status: 404 });

    const parsedMeta = parseCommunityMeta(community);

    if (action === 'request-join') {
      let pending: string[] = parsedMeta.pendingRequestIds || [];
      if (!pending.includes(userId)) pending.push(userId);

      prisma.notification.create({
        data: {
          userId: community.createdById,
          actorId: userId,
          type: 'community_request',
          title: 'New Community Join Request',
          content: `A user requested to join ${community.name}`,
          linkId: community.id,
        },
      }).catch((e) => console.error('Notification creation error:', e));

      const newTags = encodeCommunityMeta(community.tags, { pendingRequestIds: pending });
      const updated = await prisma.community.update({
        where: { id: communityId },
        data: { tags: newTags },
      });

      return NextResponse.json({ community: parseCommunityMeta(updated) });
    }

    if (action === 'cancel-request') {
      let pending: string[] = parsedMeta.pendingRequestIds || [];
      pending = pending.filter((id) => id !== userId);

      const newTags = encodeCommunityMeta(community.tags, { pendingRequestIds: pending });
      const updated = await prisma.community.update({
        where: { id: communityId },
        data: { tags: newTags },
      });

      return NextResponse.json({ community: parseCommunityMeta(updated) });
    }

    if (action === 'handle-request') {
      let members: string[] = parsedMeta.memberIds || [];
      let pending: string[] = parsedMeta.pendingRequestIds || [];

      pending = pending.filter((id) => id !== applicantId);
      if (decision === 'approve' && !members.includes(applicantId)) {
        members.push(applicantId);
      }

      const newTags = encodeCommunityMeta(community.tags, { pendingRequestIds: pending });
      const updated = await prisma.community.update({
        where: { id: communityId },
        data: {
          memberIds: JSON.stringify(members),
          tags: newTags,
        },
      });

      return NextResponse.json({ community: parseCommunityMeta(updated) });
    }

    if (action === 'invite-user') {
      const targetUser = targetUserId || applicantId;
      if (!targetUser) return NextResponse.json({ error: 'Target user required for invite' }, { status: 400 });

      let invited: string[] = parsedMeta.invitedUserIds || [];
      if (!invited.includes(targetUser)) invited.push(targetUser);

      prisma.notification.create({
        data: {
          userId: targetUser,
          actorId: userId || community.createdById,
          type: 'community_invite',
          title: 'Community Invitation',
          content: `You were invited to join ${community.name}`,
          linkId: community.id,
        },
      }).catch((e) => console.error('Invite notification error:', e));

      const newTags = encodeCommunityMeta(community.tags, { invitedUserIds: invited });
      const updated = await prisma.community.update({
        where: { id: communityId },
        data: { tags: newTags },
      });

      return NextResponse.json({ community: parseCommunityMeta(updated) });
    }

    if (action === 'accept-invite') {
      let members: string[] = parsedMeta.memberIds || [];
      let invited: string[] = parsedMeta.invitedUserIds || [];

      invited = invited.filter((id) => id !== userId);
      if (!members.includes(userId)) members.push(userId);

      const newTags = encodeCommunityMeta(community.tags, { invitedUserIds: invited });
      const updated = await prisma.community.update({
        where: { id: communityId },
        data: {
          memberIds: JSON.stringify(members),
          tags: newTags,
        },
      });

      return NextResponse.json({ community: parseCommunityMeta(updated) });
    }

    if (action === 'decline-invite') {
      let invited: string[] = parsedMeta.invitedUserIds || [];
      invited = invited.filter((id) => id !== userId);

      const newTags = encodeCommunityMeta(community.tags, { invitedUserIds: invited });
      const updated = await prisma.community.update({
        where: { id: communityId },
        data: { tags: newTags },
      });

      return NextResponse.json({ community: parseCommunityMeta(updated) });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process request action' }, { status: 500 });
  }
}
