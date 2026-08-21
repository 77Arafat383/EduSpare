import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
      try {
        await prisma.message.updateMany({
          where: {
            senderId: targetUserId,
            receiverId: userId,
          },
          data: {
            isSeen: true,
            isRead: true,
          },
        });
      } catch (err) {
        console.warn('Update seen status error:', err);
      }

      // Check block status
      const isBlocked = await prisma.userBlock.findFirst({
        where: {
          OR: [
            { blockerId: userId, blockedId: targetUserId },
            { blockerId: targetUserId, blockedId: userId },
          ],
        },
      });

      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: targetUserId },
            { senderId: targetUserId, receiverId: userId },
          ],
        },
        include: {
          sender: true,
          receiver: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      return NextResponse.json({
        messages: messages.map((m) => ({
          ...m,
          isSeen: m.isSeen ?? (m as any).isRead ?? false,
          createdAt: m.createdAt.toISOString(),
        })),
        isBlocked: !!isBlocked,
        iAmBlocker: isBlocked ? isBlocked.blockerId === userId : false,
      });
    }

    // Get all messages involving userId to compute last message timestamp and unseen counts
    const allUserMessages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: 'desc' },
    });

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
          lastMessageSnippet: msg.content,
          isMeSender: msg.senderId === userId,
          unseenCount: 0,
        };
      }

      const isSeenVal = msg.isSeen ?? (msg as any).isRead ?? false;
      if (msg.receiverId === userId && msg.senderId === contactId && !isSeenVal) {
        recentConversations[contactId].unseenCount += 1;
      }
    });

    const contacts = await prisma.user.findMany({
      where: { id: { in: Array.from(contactIdsSet) } },
    });

    return NextResponse.json({ contacts, recentConversations });
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
        sender: true,
        receiver: true,
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
      include: { sender: true, receiver: true },
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
