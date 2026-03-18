import { NextRequest, NextResponse } from 'next/server';
import { hnAPI } from '@/lib/hn-api';
import type { Comment } from '@/lib/types';

const PAGE_SIZE = 20;

async function fetchCommentWithReplies(commentId: number, depth: number = 0, maxDepth: number = 10): Promise<Comment | null> {
  if (depth > maxDepth) return null;
  
  const comment = await hnAPI.getComment(commentId);
  if (!comment || comment.deleted || comment.dead) return null;

  // Recursively fetch all nested replies
  if (comment.kids && comment.kids.length > 0) {
    const replies = await Promise.all(
      comment.kids.map(id => fetchCommentWithReplies(id, depth + 1, maxDepth))
    );
    return {
      ...comment,
      replies: replies.filter((r): r is Comment => r !== null),
    };
  }

  return { ...comment, replies: [] };
}

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
      return NextResponse.json({ comments: [], total: 0, totalPages: 0, page });
    }

    const totalTopLevel = story.kids.length;
    const totalPages = Math.ceil(totalTopLevel / PAGE_SIZE);
    const pageIds = story.kids.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // Fetch top-level comments with all nested replies
    const comments = await Promise.all(
      pageIds.map(id => fetchCommentWithReplies(id))
    );
    const validComments = comments.filter((c): c is Comment => c !== null);

    return NextResponse.json({
      comments: validComments,
      total: totalTopLevel,
      page,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}
