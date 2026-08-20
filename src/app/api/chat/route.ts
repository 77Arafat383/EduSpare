import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const targetUserId = searchParams.get('targetUserId');

    if (!userId) {
      return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 });
    }

    if (targetUserId) {
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
          createdAt: m.createdAt.toISOString(),
        })),
        isBlocked: !!isBlocked,
        iAmBlocker: isBlocked ? isBlocked.blockerId === userId : false,
      });
    }

    // Get all unique conversation contacts for userId
    const sentMessages = await prisma.message.findMany({
      where: { senderId: userId },
      select: { receiverId: true },
    });

    const receivedMessages = await prisma.message.findMany({
      where: { receiverId: userId },
      select: { senderId: true },
    });

    const contactIds = Array.from(
      new Set([
        ...sentMessages.map((m) => m.receiverId),
        ...receivedMessages.map((m) => m.senderId),
      ])
    );

    const contacts = await prisma.user.findMany({
      where: { id: { in: contactIds } },
    });

    return NextResponse.json({ contacts });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
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
