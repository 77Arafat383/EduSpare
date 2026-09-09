import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sortTasksByPriority } from '@/lib/priorityAlgorithm';
import { getRankFromPoints } from '@/lib/rankSystem';
import { jsonWithEtag, publicUserSelect, authorSelect } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Combined polling endpoint.
 *
 * Replaces the separate periodic calls to /api/auth (presence list), /api/tasks,
 * /api/notifications, /api/chat (conversation list) and /api/auth/heartbeat with a
 * single request. All queries run in parallel and the response is ETag'd, so when
 * nothing changed the client receives an empty 304.
 *
 * GET /api/sync?userId=...&include=users,tasks,notifications,conversations
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const includeParam = searchParams.get('include');
    const include = new Set(
      includeParam ? includeParam.split(',').map((s) => s.trim()) : ['users', 'tasks', 'notifications', 'conversations']
    );
    const heartbeat = searchParams.get('heartbeat') !== '0';

    const [users, tasks, notifications, userMessages] = await Promise.all([
      include.has('users')
        ? prisma.user.findMany({ orderBy: { createdAt: 'asc' }, select: publicUserSelect })
        : null,
      include.has('tasks')
        ? prisma.task.findMany({ where: { userId }, include: { user: { select: authorSelect } } })
        : null,
      include.has('notifications')
        ? prisma.notification.findMany({
            where: { userId },
            include: { actor: { select: authorSelect } },
            orderBy: { createdAt: 'desc' },
            take: 30,
          })
        : null,
      include.has('conversations')
        ? prisma.message.findMany({
            where: { OR: [{ senderId: userId }, { receiverId: userId }] },
            select: { senderId: true, receiverId: true, content: true, isSeen: true, isRead: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
          })
        : null,
      // Presence heartbeat piggybacks on the poll; failures must not break the response.
      heartbeat
        ? prisma.user
            .update({ where: { id: userId }, data: { lastActiveAt: new Date() }, select: { id: true } })
            .catch(() => null)
        : null,
    ]);

    const payload: Record<string, unknown> = {};

    if (users) {
      payload.allUsers = users.map((u) => ({ ...u, rank: getRankFromPoints(u.totalPoints) }));
    }

    if (tasks) {
      payload.tasks = sortTasksByPriority(
        tasks.map((task) => ({
          ...task,
          dueAt: task.dueAt.toISOString(),
          startTime: task.startTime ? task.startTime.toISOString() : null,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
          materials: JSON.parse(task.materials || '[]'),
        }))
      );
    }

    if (notifications) {
      payload.notifications = notifications.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() }));
    }

    if (userMessages) {
      const recentConversations: Record<
        string,
        { lastMessageAt: string; lastMessageSnippet: string; isMeSender: boolean; unseenCount: number }
      > = {};
      userMessages.forEach((msg) => {
        const contactId = msg.senderId === userId ? msg.receiverId : msg.senderId;
        if (!recentConversations[contactId]) {
          recentConversations[contactId] = {
            lastMessageAt: msg.createdAt.toISOString(),
            lastMessageSnippet: msg.content.length > 120 ? msg.content.slice(0, 120) : msg.content,
            isMeSender: msg.senderId === userId,
            unseenCount: 0,
          };
        }
        const isSeenVal = msg.isSeen ?? msg.isRead ?? false;
        if (msg.receiverId === userId && !isSeenVal) {
          recentConversations[contactId].unseenCount += 1;
        }
      });
      payload.recentConversations = recentConversations;
    }

    return jsonWithEtag(request, payload);
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Failed to sync' }, { status: 500 });
  }
}
