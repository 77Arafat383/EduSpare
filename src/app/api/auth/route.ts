import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateUserStreak } from '@/lib/streak';
import { getRankFromPoints } from '@/lib/rankSystem';
import { jsonWithEtag, publicUserSelect } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEFAULT_PASSWORD = 'password123';
const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,30}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalize = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/**
 * GET /api/auth
 *
 * This request gates the very first paint of the app (login card / restored
 * session), so it must be a single cheap SELECT. The expensive streak/rank
 * recomputation that used to run here (full scan of tasks + blogs for every
 * user, followed by a write transaction) now lives in the throttled
 * /api/sync poll, which only runs for already signed-in users.
 */
export async function GET(request: Request) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: publicUserSelect,
    });

    const allUsers = users.map((user: any) => ({ ...user, rank: getRankFromPoints(user.totalPoints) }));
    return jsonWithEtag(request, { allUsers });
  } catch (error) {
    console.error('Auth GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch user profiles' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const action = body?.action;

  try {
    if (action === 'register') {
      const username = normalize(body.username);
      const name = normalize(body.name);
      const email = normalize(body.email).toLowerCase();
      const password = typeof body.password === 'string' ? body.password : '';

      if (!username || !name || !email) {
        return NextResponse.json({ error: 'Name, username and email are required.' }, { status: 400 });
      }
      if (!USERNAME_RE.test(username)) {
        return NextResponse.json(
          { error: 'Username must be 3-30 characters (letters, numbers, dot, dash or underscore).' },
          { status: 400 }
        );
      }
      if (!EMAIL_RE.test(email)) {
        return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
      }
      if (password && password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
      }

      const initialPoints = 100;

      try {
        // Rely on the DB unique constraints instead of a pre-check query:
        // one round-trip instead of two and no duplicate-race window.
        const newUser = await prisma.user.create({
          select: publicUserSelect,
          data: {
            username,
            name,
            email,
            password: password || DEFAULT_PASSWORD,
            avatar: '/assets/default_avatar.svg',
            coverImage: '/assets/default_cover.png',
            bio: 'EduSpare member excited to learn and share knowledge.',
            activeStreak: 0,
            totalPoints: initialPoints,
            rank: getRankFromPoints(initialPoints),
            lastActiveAt: new Date(),
          },
        });

        return NextResponse.json({ user: newUser });
      } catch (err: any) {
        // P2002 = unique constraint violation (email / username already taken)
        if (err?.code === 'P2002') {
          const target = (err.meta?.target as string[] | string | undefined) ?? '';
          const field = Array.isArray(target) ? target.join(',') : String(target);
          const message = field.includes('email')
            ? 'An account with this email already exists.'
            : field.includes('username')
              ? 'This username is already taken.'
              : 'User with this email or username already exists.';
          return NextResponse.json({ error: message }, { status: 400 });
        }
        throw err;
      }
    }

    if (action === 'login') {
      const identifier = normalize(body.username) || normalize(body.email);
      const password = typeof body.password === 'string' ? body.password : '';

      if (!identifier || !password) {
        return NextResponse.json({ error: 'Username/email and password are required.' }, { status: 400 });
      }

      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: identifier, mode: 'insensitive' } },
            { username: { equals: identifier, mode: 'insensitive' } },
          ],
        },
        select: { id: true, password: true },
      });

      if (!user || user.password !== password) {
        return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
      }

      const streak = await calculateUserStreak(user.id);
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date(), activeStreak: streak },
        select: publicUserSelect,
      });

      return NextResponse.json({
        user: { ...updatedUser, rank: getRankFromPoints(updatedUser.totalPoints) },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Auth POST error:', error);
    return NextResponse.json({ error: 'Authentication request failed' }, { status: 500 });
  }
}
