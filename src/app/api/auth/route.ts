import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateUserStreak, calculateStreaksForUsers } from '@/lib/streak';
import { getRankFromPoints } from '@/lib/rankSystem';
import { jsonWithEtag, publicUserSelect } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Streak/rank recomputation is expensive (scans tasks + blogs); throttle it so the
// frequently polled presence list stays a single cheap SELECT most of the time.
const STREAK_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const globalForAuth = globalThis as unknown as { __eduspareLastStreakRefresh?: number };

export async function GET(request: Request) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: publicUserSelect,
    });

    const now = Date.now();
    const shouldRefresh = now - (globalForAuth.__eduspareLastStreakRefresh ?? 0) > STREAK_REFRESH_INTERVAL_MS;

    let result = users;
    if (shouldRefresh) {
      globalForAuth.__eduspareLastStreakRefresh = now;
      const streaks = await calculateStreaksForUsers(users.map((u) => u.id));
      const updates: Promise<unknown>[] = [];
      result = users.map((user) => {
        const streak = streaks.get(user.id) ?? user.activeStreak;
        const calculatedRank = getRankFromPoints(user.totalPoints);
        if (streak !== user.activeStreak || calculatedRank !== user.rank) {
          updates.push(
            prisma.user.update({
              where: { id: user.id },
              data: { activeStreak: streak, rank: calculatedRank },
            })
          );
        }
        return { ...user, activeStreak: streak, rank: calculatedRank };
      });
      if (updates.length) await prisma.$transaction(updates as any);
    } else {
      result = users.map((user) => ({ ...user, rank: getRankFromPoints(user.totalPoints) }));
    }

    return jsonWithEtag(request, { allUsers: result });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch user profiles' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, username, name, email, password } = body;

    if (action === 'register') {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'User with this email or username already exists.' },
          { status: 400 }
        );
      }

      const initialPoints = 100;

      const newUser = await prisma.user.create({
        select: publicUserSelect,
        data: {
          username,
          name,
          email,
          password: password || 'password123',
          avatar: '/assets/default_avatar.png',
          coverImage: '/assets/default_cover.png',
          bio: 'EduSpare member excited to learn and share knowledge.',
          activeStreak: 0,
          totalPoints: initialPoints,
          rank: getRankFromPoints(initialPoints),
          lastActiveAt: new Date(),
        },
      });

      return NextResponse.json({ user: newUser });
    }

    if (action === 'login') {
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: username }, { username }],
        },
      });

      if (!user) {
        return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
      }

      const streak = await calculateUserStreak(user.id);
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date(), activeStreak: streak },
        select: publicUserSelect,
      });

      return NextResponse.json({ user: updatedUser });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Authentication request failed' }, { status: 500 });
  }
}
