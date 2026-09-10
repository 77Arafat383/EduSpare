import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonWithEtag, authorSelect, publicUserSelect } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Messages returned per thread request (older history can be paged later). */
const THREAD_LIMIT = 200;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const targetUserId = searchParams.get('targetUserId');

    if (!userId) {
      return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 });
    }

    if (targetUserId) {
      // Mark all messages received from targetUserId as seen by userId
      // (only touch rows that actually need it to avoid needless writes).
      try {
        await prisma.message.updateMany({
          where: {
            senderId: targetUserId,
            receiverId: userId,
            OR: [{ isSeen: false }, { isRead: false }],
          },
          data: {
            isSeen: true,
            isRead: true,
          },
        });
      } catch (err) {
        console.warn('Update seen status error:', err);
      }

      const [isBlocked, messages] = await Promise.all([
        prisma.userBlock.findFirst({
          where: {
            OR: [
              { blockerId: userId, blockedId: targetUserId },
              { blockerId: targetUserId, blockedId: userId },
            ],
          },
        }),
        // Latest N messages only (chat UI never needs the sender relation — the
        // sidebar already has every user). Oldest-first order is restored below.
        prisma.message.findMany({
          where: {
            OR: [
              { senderId: userId, receiverId: targetUserId },
              { senderId: targetUserId, receiverId: userId },
            ],
          },
          orderBy: { createdAt: 'desc' },
          take: THREAD_LIMIT,
        }),
      ]);
      messages.reverse();

      return jsonWithEtag(request, {
        messages: messages.map((m) => ({
          ...m,
          isSeen: m.isSeen ?? (m as any).isRead ?? false,
          createdAt: m.createdAt.toISOString(),
        })),
        isBlocked: !!isBlocked,
        iAmBlocker: isBlocked ? isBlocked.blockerId === userId : false,
      });
    }

    // Latest message per contact + unseen counts (two indexed queries instead of
    // loading the user's entire message history).
    const [latest, unseen] = await Promise.all([
      prisma.$queryRaw<{ contactId: string; content: string; createdAt: Date; senderId: string }[]>`
        SELECT DISTINCT ON (contact) contact AS "contactId", content, "createdAt", "senderId"
        FROM (
          SELECT CASE WHEN "senderId" = ${userId} THEN "receiverId" ELSE "senderId" END AS contact,
                 content, "createdAt", "senderId"
          FROM "Message"
          WHERE "senderId" = ${userId} OR "receiverId" = ${userId}
        ) m
        ORDER BY contact, "createdAt" DESC
      `,
      prisma.message.groupBy({
        by: ['senderId'],
        where: { receiverId: userId, isSeen: false, isRead: false },
        _count: { _all: true },
      }),
    ]);
    const unseenBySender = new Map<string, number>(unseen.map((u) => [u.senderId, u._count._all]));
    const allUserMessages = latest.map((m) => ({
      senderId: m.senderId,
      receiverId: m.senderId === userId ? m.contactId : userId,
      content: m.content,
      createdAt: new Date(m.createdAt),
      isSeen: true,
      isRead: true,
      _unseen: unseenBySender.get(m.contactId) ?? 0,
    }));

    const recentConversations: Record<
      string,
      { lastMessageAt: string; lastMessageSnippet: string; isMeSender: boolean; unseenCount: number }
    > = {};

    const contactIdsSet = new Set<string>();

    allUserMessages.forEach((msg) => {
      const contactId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      contactIdsSet.add(contactId);

      if (!recentConversations[contactId]) {
        recentConversations[contactId] = {
          lastMessageAt: msg.createdAt.toISOString(),
          lastMessageSnippet: msg.content.length > 120 ? msg.content.slice(0, 120) : msg.content,
          isMeSender: msg.senderId === userId,
          unseenCount: msg._unseen,
        };
      }
    });

    const contacts = await prisma.user.findMany({
      where: { id: { in: Array.from(contactIdsSet) } },
      select: publicUserSelect,
    });

    return jsonWithEtag(request, { contacts, recentConversations });
  } catch (error) {
    console.error('Get messages API error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userId, targetUserId } = body;

    if (!userId || !targetUserId) {
      return NextResponse.json({ error: 'userId and targetUserId required' }, { status: 400 });
    }

    await prisma.message.updateMany({
      where: {
        senderId: targetUserId,
        receiverId: userId,
        isSeen: false,
      },
      data: {
        isSeen: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update seen status' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { senderId, receiverId, content } = body;

    if (!senderId || !receiverId || !content) {
      return NextResponse.json({ error: 'Sender, receiver, and content required' }, { status: 400 });
    }

    // Verify block status
    const blockCheck = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: senderId, blockedId: receiverId },
          { blockerId: receiverId, blockedId: senderId },
        ],
      },
    });

    if (blockCheck) {
      return NextResponse.json(
        { error: 'Cannot send message because one of the users has blocked the other.' },
        { status: 403 }
      );
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
      },
      include: {
        sender: { select: authorSelect },
      },
    });

    return NextResponse.json({
      message: {
        ...message,
        createdAt: message.createdAt.toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { messageId, userId, content } = body;

    if (!messageId || !userId || !content) {
      return NextResponse.json({ error: 'messageId, userId and content are required' }, { status: 400 });
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.senderId !== userId) {
      return NextResponse.json({ error: 'Unauthorized to edit this message' }, { status: 403 });
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { content },
      include: { sender: { select: authorSelect } },
    });

    return NextResponse.json({
      message: {
        ...updatedMessage,
        createdAt: updatedMessage.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Update message error:', error);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    const userId = searchParams.get('userId');

    if (!messageId || !userId) {
      return NextResponse.json({ error: 'messageId and userId are required' }, { status: 400 });
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.senderId !== userId && message.receiverId !== userId) {
      return NextResponse.json({ error: 'Unauthorized to delete this message' }, { status: 403 });
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete message error:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
