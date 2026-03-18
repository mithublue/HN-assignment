/**
 * Comments API Route Handler
 * 
 * This endpoint fetches comments for a story with full nested replies.
 * Implements pagination for top-level comments while fetching all nested replies.
 * 
 * Endpoint:
 * GET /api/comments/[id]?page=1
 * 
 * URL Parameter:
 * - id: Hacker News story ID
 * 
 * Query Parameter:
 * - page: Page number (default: 1)
 * 
 * Returns:
 * - comments: Array of comment objects with nested replies
 * - total: Total number of top-level comments
 * - page: Current page number
 * - totalPages: Total number of pages
 */

import { NextRequest, NextResponse } from 'next/server';
import { hnAPI } from '@/lib/hn-api';
import type { Comment } from '@/lib/types';

/**
 * Number of top-level comments per page
 * 
 * Why 20?
 * - Balances load time vs. user experience
 * - Each comment can have many nested replies
 * - Prevents overwhelming the UI with too many comments at once
 */
const PAGE_SIZE = 20;

/**
 * Recursively fetches a comment and all its nested replies
 * 
 * This function implements a depth-first search to build the complete
 * comment tree for a given comment ID.
 * 
 * @param commentId - The HN comment ID to fetch
 * @param depth - Current recursion depth (prevents infinite loops)
 * @param maxDepth - Maximum recursion depth (default: 10 levels)
 * @returns Comment object with nested replies, or null if not found/deleted
 * 
 * Process:
 * 1. Fetch the comment from HN API
 * 2. If comment has replies (kids), recursively fetch each one
 * 3. Attach replies to the comment object
 * 4. Return the complete comment tree
 * 
 * Why maxDepth?
 * - Prevents infinite recursion if HN data has circular references
 * - HN comments rarely go deeper than 10 levels
 * - Protects against stack overflow errors
 * 
 * Performance Note:
 * - Uses Promise.all() to fetch all replies in parallel
 * - Much faster than sequential fetching
 * - Can still be slow for comments with many nested replies
 */
async function fetchCommentWithReplies(
  commentId: number,
  depth: number = 0,
  maxDepth: number = 10
): Promise<Comment | null> {
  // Stop recursion if max depth reached
  if (depth > maxDepth) return null;
  
  // Fetch the comment from HN API
  const comment = await hnAPI.getComment(commentId);
  
  // Return null if comment doesn't exist, is deleted, or is dead
  if (!comment || comment.deleted || comment.dead) return null;

  // Recursively fetch all nested replies
  if (comment.kids && comment.kids.length > 0) {
    // Fetch all child comments in parallel
    const replies = await Promise.all(
      comment.kids.map(id => fetchCommentWithReplies(id, depth + 1, maxDepth))
    );
    
    // Filter out null replies (deleted/not found)
    // Attach replies array to comment
    return {
      ...comment,
      replies: replies.filter((r): r is Comment => r !== null),
    };
  }

  // No replies, return comment with empty replies array
  return { ...comment, replies: [] };
}

/**
 * GET Handler: Fetch paginated comments with full nesting
 * 
 * Process:
 * 1. Validate story ID and page number
 * 2. Fetch story to get top-level comment IDs
 * 3. Calculate pagination (which comments to fetch)
 * 4. Fetch each top-level comment with all its nested replies
 * 5. Return paginated results with metadata
 * 
 * Pagination Strategy:
 * - Only top-level comments are paginated
 * - All nested replies are fetched for each top-level comment
 * - This ensures complete conversation threads are visible
 * 
 * Example Requests:
 * GET /api/comments/38471822 - Get first page of comments
 * GET /api/comments/38471822?page=2 - Get second page
 * 
 * Response Format:
 * {
 *   comments: [
 *     {
 *       id: 123,
 *       by: "username",
 *       text: "comment text",
 *       time: 1234567890,
 *       replies: [
 *         { id: 124, by: "user2", text: "reply", replies: [...] }
 *       ]
 *     }
 *   ],
 *   total: 150,        // Total top-level comments
 *   page: 1,           // Current page
 *   totalPages: 8      // Total pages (150 / 20 = 8)
 * }
 * 
 * Used by:
 * - Story detail page (app/story/[id]/page.tsx)
 * - CommentItem component renders nested structure
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Extract story ID from URL
    const { id } = await params;
    const storyId = parseInt(id);
    
    // Extract page number from query string (default: 1)
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');

    // Validate story ID
    if (isNaN(storyId)) {
      return NextResponse.json({ error: 'Invalid story ID' }, { status: 400 });
    }

    // Fetch story to get comment IDs
    const story = await hnAPI.getStory(storyId);
    
    // Return empty result if story has no comments
    if (!story || !story.kids) {
      return NextResponse.json({ comments: [], total: 0, totalPages: 0, page });
    }

    // Calculate pagination
    const totalTopLevel = story.kids.length;
    const totalPages = Math.ceil(totalTopLevel / PAGE_SIZE);
    
    // Get comment IDs for current page
    // Example: Page 1 = comments 0-19, Page 2 = comments 20-39
    const pageIds = story.kids.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // Fetch top-level comments with all nested replies
    // Each call to fetchCommentWithReplies() recursively fetches the entire tree
    const comments = await Promise.all(
      pageIds.map(id => fetchCommentWithReplies(id))
    );
    
    // Filter out null comments (deleted or not found)
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
