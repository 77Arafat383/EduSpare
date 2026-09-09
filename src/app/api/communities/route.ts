import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonWithEtag } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

function parseCommunityMeta(c: any) {
  let meta: any = {};
  try {
    const parsed = JSON.parse(c.tags || '[]');
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      meta = parsed;
    } else {
      meta = { tagsList: parsed };
    }
  } catch (e) {
    meta = { tagsList: [] };
  }

  return {
    ...c,
    createdAt: c.createdAt.toISOString(),
    tags: Array.isArray(meta.tagsList) ? meta.tagsList : [],
    memberIds: JSON.parse(c.memberIds || '[]'),
    adminIds: meta.adminIds || [c.createdById],
    pendingRequestIds: meta.pendingRequestIds || [],
    invitedUserIds: meta.invitedUserIds || [],
    avatarImage: meta.avatarImage || c.image,
    rules: meta.rules || null,
  };
}

function encodeCommunityMeta(
  existingTagsStr: string,
  updates: {
    tagsList?: string[];
    avatarImage?: string | null;
    rules?: string | null;
    adminIds?: string[];
    pendingRequestIds?: string[];
    invitedUserIds?: string[];
  }
) {
  let meta: any = {};
  try {
    const parsed = JSON.parse(existingTagsStr || '[]');
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      meta = parsed;
    } else {
      meta = { tagsList: parsed };
    }
  } catch (e) {
    meta = { tagsList: [] };
  }

  if (updates.tagsList !== undefined) meta.tagsList = updates.tagsList;
  if (updates.avatarImage !== undefined) meta.avatarImage = updates.avatarImage;
  if (updates.rules !== undefined) meta.rules = updates.rules;
  if (updates.adminIds !== undefined) meta.adminIds = updates.adminIds;
  if (updates.pendingRequestIds !== undefined) meta.pendingRequestIds = updates.pendingRequestIds;
  if (updates.invitedUserIds !== undefined) meta.invitedUserIds = updates.invitedUserIds;

  return JSON.stringify(meta);
}

export async function GET(request: Request) {
  try {
    const communities = await prisma.community.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return jsonWithEtag(request, {
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
      targetUserId,
      memberId,
      decision,
    } = body;

    const createdByIdVal = body.createdById || userId;
    const targetUser = targetUserId || applicantId;

    if (action === 'create') {
      if (!name || !description || !createdByIdVal) {
        return NextResponse.json({ error: 'Missing community name, description, or creator' }, { status: 400 });
      }

      const tagsList = typeof tags === 'string' ? [tags] : tags || [];
      const tagsPayload = encodeCommunityMeta('[]', {
        tagsList,
        avatarImage: avatarImage || image || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
        rules: rules || null,
        adminIds: [createdByIdVal],
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
          memberIds: JSON.stringify([createdByIdVal]),
          createdById: createdByIdVal,
        },
      });

      return NextResponse.json({
        community: parseCommunityMeta(newCommunity),
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
        community: parseCommunityMeta(updated),
      });
    }

    if (action === 'request-join') {
      const community = await prisma.community.findUnique({ where: { id: communityId } });
      if (!community) return NextResponse.json({ error: 'Community not found' }, { status: 404 });

      const parsedMeta = parseCommunityMeta(community);
      let pending: string[] = parsedMeta.pendingRequestIds || [];
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

      const newTags = encodeCommunityMeta(community.tags, { pendingRequestIds: pending });
      const updated = await prisma.community.update({
        where: { id: communityId },
        data: { tags: newTags },
      });

      return NextResponse.json({
        community: parseCommunityMeta(updated),
      });
    }

    if (action === 'cancel-request') {
      const community = await prisma.community.findUnique({ where: { id: communityId } });
      if (!community) return NextResponse.json({ error: 'Community not found' }, { status: 404 });

      const parsedMeta = parseCommunityMeta(community);
      let pending: string[] = parsedMeta.pendingRequestIds || [];
      pending = pending.filter((id) => id !== userId);

      const newTags = encodeCommunityMeta(community.tags, { pendingRequestIds: pending });
      const updated = await prisma.community.update({
        where: { id: communityId },
        data: { tags: newTags },
      });

      return NextResponse.json({
        community: parseCommunityMeta(updated),
      });
    }

    if (action === 'handle-request') {
      const community = await prisma.community.findUnique({ where: { id: communityId } });
      if (!community) return NextResponse.json({ error: 'Community not found' }, { status: 404 });

      const parsedMeta = parseCommunityMeta(community);
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

      return NextResponse.json({
        community: parseCommunityMeta(updated),
      });
    }

    if (action === 'update-cover') {
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
        community: parseCommunityMeta(updated),
      });
    }

    if (action === 'invite-user') {
      const community = await prisma.community.findUnique({ where: { id: communityId } });
      if (!community) return NextResponse.json({ error: 'Community not found' }, { status: 404 });

      if (!targetUser) {
        return NextResponse.json({ error: 'Target user required for invite' }, { status: 400 });
      }

      const parsedMeta = parseCommunityMeta(community);
      let invited: string[] = parsedMeta.invitedUserIds || [];
      if (!invited.includes(targetUser)) {
        invited.push(targetUser);
      }

      // Dispatch invitation notification to invited user
      try {
        await prisma.notification.create({
          data: {
            userId: targetUser,
            actorId: userId || createdByIdVal,
            type: 'community_invite',
            title: 'Community Invitation',
            content: `You were invited to join ${community.name}`,
            linkId: community.id,
          },
        });
      } catch (e) {
        console.error('Invite notification error:', e);
      }

      const newTags = encodeCommunityMeta(community.tags, { invitedUserIds: invited });
      const updated = await prisma.community.update({
        where: { id: communityId },
        data: { tags: newTags },
      });

      return NextResponse.json({
        community: parseCommunityMeta(updated),
      });
    }

    if (action === 'accept-invite') {
      const community = await prisma.community.findUnique({ where: { id: communityId } });
      if (!community) return NextResponse.json({ error: 'Community not found' }, { status: 404 });

      const parsedMeta = parseCommunityMeta(community);
      let members: string[] = parsedMeta.memberIds || [];
      let invited: string[] = parsedMeta.invitedUserIds || [];

      invited = invited.filter((id) => id !== userId);
      if (!members.includes(userId)) {
        members.push(userId);
      }

      const newTags = encodeCommunityMeta(community.tags, { invitedUserIds: invited });
      const updated = await prisma.community.update({
        where: { id: communityId },
        data: {
          memberIds: JSON.stringify(members),
          tags: newTags,
        },
      });

      return NextResponse.json({
        community: parseCommunityMeta(updated),
      });
    }

    if (action === 'decline-invite') {
      const community = await prisma.community.findUnique({ where: { id: communityId } });
      if (!community) return NextResponse.json({ error: 'Community not found' }, { status: 404 });

      const parsedMeta = parseCommunityMeta(community);
      let invited: string[] = parsedMeta.invitedUserIds || [];
      invited = invited.filter((id) => id !== userId);

      const newTags = encodeCommunityMeta(community.tags, { invitedUserIds: invited });
      const updated = await prisma.community.update({
        where: { id: communityId },
        data: { tags: newTags },
      });

      return NextResponse.json({
        community: parseCommunityMeta(updated),
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
