import { NextRequest, NextResponse } from 'next/server';
import { hnAPI } from '@/lib/hn-api';

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

    const comments = await hnAPI.getAllComments(storyId);

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}
