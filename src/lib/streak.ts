import { prisma } from '@/lib/prisma';

/**
 * Computes continuous active streak for a user.
 * An active day is a day where the user:
 * 1. Completed at least 1 task (status = 'Completed').
 * 2. OR published at least 1 blog post.
 * 
 * If a full day has passed with 0 activities, streak resets to 0.
 */
export async function calculateUserStreak(userId: string): Promise<number> {
  try {
    // 1. Fetch completed tasks for user
    const completedTasks = await prisma.task.findMany({
      where: {
        userId,
        status: 'Completed',
      },
      select: {
        updatedAt: true,
        createdAt: true,
      },
    });

    // 2. Fetch blogs posted by user
    const blogs = await prisma.blog.findMany({
      where: {
        authorId: userId,
      },
      select: {
        createdAt: true,
      },
    });

    // Extract unique activity dates (YYYY-MM-DD in local time)
    const activityDates = new Set<string>();

    const formatDateKey = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    completedTasks.forEach((t) => {
      if (t.updatedAt) activityDates.add(formatDateKey(new Date(t.updatedAt)));
      if (t.createdAt) activityDates.add(formatDateKey(new Date(t.createdAt)));
    });

    blogs.forEach((b) => {
      if (b.createdAt) activityDates.add(formatDateKey(new Date(b.createdAt)));
    });

    if (activityDates.size === 0) {
      return 0;
    }

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
    while (true) {
      const dateKey = formatDateKey(checkDate);
      if (activityDates.has(dateKey)) {
        streak += 1;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error('Error calculating user streak:', error);
    return 0;
  }
}
