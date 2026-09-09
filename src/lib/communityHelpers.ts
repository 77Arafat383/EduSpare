export function parseCommunityMeta(c: any) {
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

export function encodeCommunityMeta(
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
