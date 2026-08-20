import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ allUsers: users });
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

      const newUser = await prisma.user.create({
        data: {
          username,
          name,
          email,
          password: password || 'password123',
          avatar: '/assets/default_avatar.png',
          coverImage: '/assets/default_cover.png',
          bio: 'EduSpare member excited to learn and share knowledge.',
          activeStreak: 1,
          totalPoints: 100,
          rank: 'New Scholar',
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

      return NextResponse.json({ user });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Authentication request failed' }, { status: 500 });
  }
}
