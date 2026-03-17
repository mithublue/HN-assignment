import { NextRequest, NextResponse } from 'next/server';
import { hnAPI } from '@/lib/hn-api';

const PAGE_SIZE = 20;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const storyId = parseInt(id);
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');

    if (isNaN(storyId)) {
      return NextResponse.json({ error: 'Invalid story ID' }, { status: 400 });
    }

    const story = await hnAPI.getStory(storyId);
    if (!story || !story.kids) {
      return NextResponse.json({ comments: [], total: 0, totalPages: 0 });
    }

    const totalTopLevel = story.kids.length;
    const totalPages = Math.ceil(totalTopLevel / PAGE_SIZE);
    const pageIds = story.kids.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // Fetch top-level comments in parallel, then their direct replies in parallel
    const topLevel = await Promise.all(pageIds.map(id => hnAPI.getComment(id)));
    const validTopLevel = topLevel.filter((c): c is NonNullable<typeof c> => c !== null && !c.deleted && !c.dead);

    // Fetch one level of replies for each top-level comment
    const withReplies = await Promise.all(
      validTopLevel.map(async (comment) => {
        if (!comment.kids?.length) return { ...comment, replies: [] };
        const replies = await Promise.all(
          comment.kids.slice(0, 5).map(id => hnAPI.getComment(id))
        );
        return {
          ...comment,
          replies: replies.filter((r): r is NonNullable<typeof r> => r !== null && !r.deleted && !r.dead),
        };
      })
    );

    return NextResponse.json({
      comments: withReplies,
      total: totalTopLevel,
      page,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}
