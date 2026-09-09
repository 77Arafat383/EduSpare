import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { publicUserSelect, authorSelect } from '@/lib/apiResponse';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const userId = searchParams.get('userId');

    let user;
    if (username) {
      user = await prisma.user.findUnique({ where: { username }, select: publicUserSelect });
    } else if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [blogs, savedItems] = await Promise.all([
      prisma.blog.findMany({
        where: {
          authorId: user.id,
          communityId: null,
        },
        include: {
          author: { select: authorSelect },
          comments: { include: { author: { select: authorSelect } } },
          reactions: { select: { id: true, blogId: true, userId: true, type: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.savedItem.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      user,
      blogs: blogs.map((b) => ({
        ...b,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
        attachments: JSON.parse(b.attachments || '[]'),
        tags: JSON.parse(b.tags || '[]'),
        likesCount: b.reactions.length,
      })),
      savedItems: savedItems.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profile data' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      name,
      bio,
      university,
      avatar,
      coverImage,
      birthday,
      gender,
      academicStatus,
      relationshipStatus,
      phone,
      address,
      interests,
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (university !== undefined) updateData.university = university;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (birthday !== undefined) updateData.birthday = birthday;
    if (gender !== undefined) updateData.gender = gender;
    if (academicStatus !== undefined) updateData.academicStatus = academicStatus;
    if (relationshipStatus !== undefined) updateData.relationshipStatus = relationshipStatus;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (interests !== undefined) updateData.interests = interests;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: publicUserSelect,
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('Update profile error details:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true, message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Delete profile error details:', error);
    return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 });
  }
}
