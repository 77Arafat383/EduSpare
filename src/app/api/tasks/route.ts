import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sortTasksByPriority } from '@/lib/priorityAlgorithm';
import { createNotification } from '@/lib/notifications';
import { jsonWithEtag, authorSelect } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const tasks = await prisma.task.findMany({
      where: userId ? { userId } : undefined,
      include: {
        user: { select: authorSelect },
      },
    });

    const formattedTasks = tasks.map((task) => ({
      ...task,
      dueAt: task.dueAt.toISOString(),
      startTime: task.startTime ? task.startTime.toISOString() : null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      materials: JSON.parse(task.materials || '[]'),
    }));

    // Apply strict EduSpare Priority Algorithm:
    // 1. Less remaining time first
    // 2. If equal, higher importance score (0-100) first
    const sortedTasks = sortTasksByPriority(formattedTasks);

    return jsonWithEtag(request, { tasks: sortedTasks });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, title, description, category, dueAt, importance, status, notes, materials, estimatedTime, startTime } = body;

    if (!userId || !title || !dueAt) {
      return NextResponse.json({ error: 'Missing required task fields (title, dueAt, userId)' }, { status: 400 });
    }

    const newTask = await prisma.task.create({
      data: {
        userId,
        title,
        description: description || '',
        category: category || 'General',
        dueAt: new Date(dueAt),
        importance: Math.min(100, Math.max(0, parseInt(importance) || 50)),
        status: status || 'Pending',
        notes: notes || '',
        materials: typeof materials === 'string' ? materials : JSON.stringify(materials || []),
        estimatedTime: estimatedTime || null,
        startTime: startTime ? new Date(startTime) : null,
      },
      include: {
        user: { select: authorSelect },
      },
    });

    // Create system notification asynchronously without blocking HTTP response
    if (startTime) {
      const startDate = new Date(startTime);
      const formattedStart = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      createNotification({
        userId,
        actorId: userId,
        type: 'task_reminder',
        title: `🔔 Task Start Notification: Time to start "${title}"!`,
        content: `Estimated duration: ${estimatedTime || 'N/A'}. Target start time: ${formattedStart} to meet deadline.`,
        linkId: newTask.id,
      }).catch((e) => console.error('Task reminder notification error:', e));
    }

    const formattedTask = {
      ...newTask,
      dueAt: newTask.dueAt.toISOString(),
      startTime: newTask.startTime ? newTask.startTime.toISOString() : null,
      createdAt: newTask.createdAt.toISOString(),
      updatedAt: newTask.updatedAt.toISOString(),
      materials: JSON.parse(newTask.materials || '[]'),
    };

    return NextResponse.json({ task: formattedTask });
  } catch (error) {
    console.error('Task creation error:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
