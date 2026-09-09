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
    // Match all @username occurrences (bail out before any DB work if none)
    const matches = content.match(/@([a-zA-Z0-9_-]+)/g);
    if (!matches) return;

    const usernames = Array.from(new Set(matches.map((m) => m.slice(1))));

    const [actor, targets] = await Promise.all([
      prisma.user.findUnique({ where: { id: actorId }, select: { id: true, username: true } }),
      prisma.user.findMany({ where: { username: { in: usernames } }, select: { id: true } }),
    ]);
    if (!actor) return;

    const recipients = targets.filter((t) => t.id !== actorId);
    if (recipients.length === 0) return;

    await prisma.notification.createMany({
      data: recipients.map((t) => ({
        userId: t.id,
        actorId,
        type: 'mention',
        title: `@${actor.username} mentioned you in a comment`,
        content: content.slice(0, 100),
        linkId,
        isRead: false,
      })),
    });
  } catch (error) {
    console.error('Notify mentions error:', error);
  }
}
