import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sortTasksByPriority } from '@/lib/priorityAlgorithm';
import { getRankFromPoints } from '@/lib/rankSystem';
import { calculateStreaksForUsers } from '@/lib/streak';
import { jsonWithEtag, publicUserSelect, authorSelect } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Streak/rank recomputation is expensive (scans tasks + blogs); it is throttled and
// runs from this poll (signed-in users only) so the login gate (/api/auth) stays cheap.
const STREAK_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const globalForSync = globalThis as unknown as { __eduspareLastStreakRefresh?: number };

async function refreshStreaksIfDue(users: { id: string; activeStreak: number; totalPoints: number; rank: string }[]) {
  const now = Date.now();
  if (now - (globalForSync.__eduspareLastStreakRefresh ?? 0) <= STREAK_REFRESH_INTERVAL_MS) return null;
  globalForSync.__eduspareLastStreakRefresh = now;
  try {
    const streaks = await calculateStreaksForUsers(users.map((u) => u.id));
    const updates = users
      .map((u) => ({ id: u.id, streak: streaks.get(u.id) ?? u.activeStreak, rank: getRankFromPoints(u.totalPoints), u }))
      .filter(({ streak, rank, u }) => streak !== u.activeStreak || rank !== u.rank)
      .map(({ id, streak, rank }) =>
        prisma.user.update({ where: { id }, data: { activeStreak: streak, rank } })
      );
    if (updates.length) await prisma.$transaction(updates);
    return streaks;
  } catch (err) {
    console.error('Streak refresh error:', err);
    return null;
  }
}

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
      const streaks = await refreshStreaksIfDue(users);
      payload.allUsers = users.map((u) => ({
        ...u,
        activeStreak: streaks?.get(u.id) ?? u.activeStreak,
        rank: getRankFromPoints(u.totalPoints),
      }));
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
