import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sortTasksByPriority } from '@/lib/priorityAlgorithm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const tasks = await prisma.task.findMany({
      where: userId ? { userId } : undefined,
      include: {
        user: true,
      },
    });

    const formattedTasks = tasks.map((task) => ({
      ...task,
      dueAt: task.dueAt.toISOString(),
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      materials: JSON.parse(task.materials || '[]'),
    }));

    // Apply strict EduSpare Priority Algorithm:
    // 1. Less remaining time first
    // 2. If equal, higher importance score (0-100) first
    const sortedTasks = sortTasksByPriority(formattedTasks);

    return NextResponse.json({ tasks: sortedTasks });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, title, description, category, dueAt, importance, status, notes } = body;

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
        materials: JSON.stringify([]),
      },
      include: {
        user: true,
      },
    });

    const formattedTask = {
      ...newTask,
      dueAt: newTask.dueAt.toISOString(),
      createdAt: newTask.createdAt.toISOString(),
      updatedAt: newTask.updatedAt.toISOString(),
      materials: [],
    };

    return NextResponse.json({ task: formattedTask });
  } catch (error) {
    console.error('Task creation error:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
