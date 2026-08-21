import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateUserStreak } from '@/lib/streak';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({
      task: {
        ...task,
        dueAt: task.dueAt.toISOString(),
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        materials: JSON.parse(task.materials || '[]'),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch task details' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, description, category, dueAt, importance, status, notes, materials, estimatedTime } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (dueAt !== undefined) updateData.dueAt = new Date(dueAt);
    if (importance !== undefined) updateData.importance = Math.min(100, Math.max(0, parseInt(importance)));
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (materials !== undefined) updateData.materials = typeof materials === 'string' ? materials : JSON.stringify(materials);
    if (estimatedTime !== undefined) updateData.estimatedTime = estimatedTime;

    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: updateData,
      include: { user: true },
    });

    if (updatedTask.userId) {
      const newStreak = await calculateUserStreak(updatedTask.userId);
      await prisma.user.update({
        where: { id: updatedTask.userId },
        data: { activeStreak: newStreak },
      });
    }

    return NextResponse.json({
      task: {
        ...updatedTask,
        dueAt: updatedTask.dueAt.toISOString(),
        createdAt: updatedTask.createdAt.toISOString(),
        updatedAt: updatedTask.updatedAt.toISOString(),
        materials: JSON.parse(updatedTask.materials || '[]'),
      },
    });
  } catch (error) {
    console.error('Task update error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.task.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true, id: params.id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
