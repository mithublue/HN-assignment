import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.bookmark.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to delete bookmark' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const storyId = parseInt(id);

    if (isNaN(storyId)) {
      return NextResponse.json(
        { error: 'Invalid story ID' },
        { status: 400 }
      );
    }

    const bookmark = await prisma.bookmark.findUnique({
      where: { storyId },
    });

    return NextResponse.json({ bookmark });
  } catch (error) {
    console.error('Error fetching bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookmark' },
      { status: 500 }
    );
  }
}
