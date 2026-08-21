import { prisma } from '@/lib/prisma';

export async function createNotification({
  userId,
  actorId,
  type,
  title,
  content,
  linkId,
}: {
  userId: string;
  actorId: string;
  type: 'mention' | 'comment' | 'reaction' | 'task_reminder';
  title: string;
  content?: string;
  linkId?: string;
}) {
  if (!userId || !actorId || (userId === actorId && type !== 'task_reminder')) return null;

  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        actorId,
        type,
        title,
        content: content || null,
        linkId: linkId || null,
        isRead: false,
      },
    });
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
}

/**
 * Parses text for `@username` mentions and sends notifications to mentioned users.
 */
export async function notifyMentions({
  content,
  actorId,
  linkId,
}: {
  content: string;
  actorId: string;
  linkId: string;
}) {
  try {
    const actor = await prisma.user.findUnique({ where: { id: actorId } });
    if (!actor) return;

    // Match all @username occurrences
    const matches = content.match(/@([a-zA-Z0-9_-]+)/g);
    if (!matches) return;

    const usernames = Array.from(new Set(matches.map((m) => m.slice(1))));

    for (const username of usernames) {
      const targetUser = await prisma.user.findUnique({ where: { username } });
      if (targetUser && targetUser.id !== actorId) {
        await createNotification({
          userId: targetUser.id,
          actorId,
          type: 'mention',
          title: `@${actor.username} mentioned you in a comment`,
          content: content.slice(0, 100),
          linkId,
        });
      }
    }
  } catch (error) {
    console.error('Notify mentions error:', error);
  }
}
