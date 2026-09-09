import { NextResponse } from 'next/server';
import { createHash } from 'crypto';

/**
 * JSON response with ETag support for polled endpoints.
 * If the client already holds the same payload (If-None-Match matches),
 * a body-less 304 is returned, which saves bandwidth and JSON parsing on the client.
 */
export function jsonWithEtag(request: Request, data: unknown, init?: ResponseInit) {
  const body = JSON.stringify(data);
  const etag = `W/"${createHash('sha1').update(body).digest('base64url')}"`;

  const headers = new Headers(init?.headers);
  headers.set('ETag', etag);
  headers.set('Cache-Control', 'private, no-cache');
  headers.set('Vary', 'If-None-Match');

  const ifNoneMatch = request.headers.get('if-none-match');
  if (ifNoneMatch && ifNoneMatch.split(',').some((t) => t.trim() === etag)) {
    return new NextResponse(null, { status: 304, headers });
  }

  headers.set('Content-Type', 'application/json; charset=utf-8');
  return new NextResponse(body, { ...init, status: init?.status ?? 200, headers });
}

/** Public user fields that are safe (and sufficient) to send to the client. */
export const publicUserSelect = {
  id: true,
  username: true,
  name: true,
  email: true,
  avatar: true,
  coverImage: true,
  bio: true,
  university: true,
  birthday: true,
  gender: true,
  academicStatus: true,
  relationshipStatus: true,
  phone: true,
  address: true,
  interests: true,
  activeStreak: true,
  totalPoints: true,
  rank: true,
  lastActiveAt: true,
  createdAt: true,
} as const;

/** Minimal user identity used when embedding authors / senders / actors in lists. */
export const authorSelect = {
  id: true,
  username: true,
  name: true,
  avatar: true,
  rank: true,
  totalPoints: true,
  activeStreak: true,
  lastActiveAt: true,
} as const;
