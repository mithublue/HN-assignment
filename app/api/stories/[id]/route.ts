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

    const story = await hnAPI.getStory(storyId);

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ story });
  } catch (error) {
    console.error('Error fetching story:', error);
    return NextResponse.json(
      { error: 'Failed to fetch story' },
      { status: 500 }
    );
  }
}
