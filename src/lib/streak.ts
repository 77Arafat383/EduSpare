import { prisma } from '@/lib/prisma';

const formatDateKey = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function streakFromDates(activityDates: Set<string>): number {
  if (activityDates.size === 0) return 0;

  const today = new Date();
  const todayStr = formatDateKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateKey(yesterday);

  let checkDate: Date;
  if (activityDates.has(todayStr)) {
    checkDate = new Date(today);
  } else if (activityDates.has(yesterdayStr)) {
    checkDate = new Date(yesterday);
  } else {
    // Streak broken (missed yesterday and today)
    return 0;
  }

  let streak = 0;
  while (activityDates.has(formatDateKey(checkDate))) {
    streak += 1;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  return streak;
}

/**
 * Computes continuous active streaks for many users with only two queries
 * (instead of two per user). An active day is a day where the user completed
 * at least 1 task or published at least 1 blog post.
 */
export async function calculateStreaksForUsers(userIds: string[]): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (userIds.length === 0) return result;

  try {
    const [completedTasks, blogs] = await Promise.all([
      prisma.task.findMany({
        where: { userId: { in: userIds }, status: 'Completed' },
        select: { userId: true, updatedAt: true, createdAt: true },
      }),
      prisma.blog.findMany({
        where: { authorId: { in: userIds } },
        select: { authorId: true, createdAt: true },
      }),
    ]);

    const datesByUser = new Map<string, Set<string>>();
    const add = (userId: string, d: Date | null) => {
      if (!d) return;
      let set = datesByUser.get(userId);
      if (!set) {
        set = new Set();
        datesByUser.set(userId, set);
      }
      set.add(formatDateKey(new Date(d)));
    };

    completedTasks.forEach((t) => {
      add(t.userId, t.updatedAt);
      add(t.userId, t.createdAt);
    });
    blogs.forEach((b) => add(b.authorId, b.createdAt));

    userIds.forEach((id) => {
      result.set(id, streakFromDates(datesByUser.get(id) ?? new Set()));
    });
  } catch (error) {
    console.error('Error calculating user streaks:', error);
    userIds.forEach((id) => result.set(id, 0));
  }

  return result;
}

/**
 * Computes continuous active streak for a single user.
 */
export async function calculateUserStreak(userId: string): Promise<number> {
  const streaks = await calculateStreaksForUsers([userId]);
  return streaks.get(userId) ?? 0;
}
