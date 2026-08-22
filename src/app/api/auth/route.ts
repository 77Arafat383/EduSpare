import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateUserStreak } from '@/lib/streak';
import { getRankFromPoints, POINT_REWARDS } from '@/lib/rankSystem';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
    });

    // Compute dynamic continuous activity streak and rank for each user
    const usersWithUpdatedStreak = await Promise.all(
      users.map(async (user) => {
        const streak = await calculateUserStreak(user.id);
        const calculatedRank = getRankFromPoints(user.totalPoints);
        if (streak !== user.activeStreak || calculatedRank !== user.rank) {
          await prisma.user.update({
            where: { id: user.id },
            data: { activeStreak: streak, rank: calculatedRank },
          });
        }
        return { ...user, activeStreak: streak, rank: calculatedRank };
      })
    );

    return NextResponse.json({ allUsers: usersWithUpdatedStreak });
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
      });

      return NextResponse.json({ user: updatedUser });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Authentication request failed' }, { status: 500 });
  }
}
