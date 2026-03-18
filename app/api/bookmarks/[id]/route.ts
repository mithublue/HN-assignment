/**
 * Individual Bookmark API Route Handler
 * 
 * This file handles operations on a single bookmark:
 * - DELETE: Remove a bookmark by its database ID
 * - GET: Check if a story is bookmarked (by story ID)
 * 
 * Endpoints:
 * - DELETE /api/bookmarks/[id] - Delete bookmark by database ID
 * - GET /api/bookmarks/[id] - Get bookmark by story ID
 * 
 * Note: The [id] parameter serves dual purpose:
 * - For DELETE: It's the database bookmark ID (cuid)
 * - For GET: It's the Hacker News story ID (number)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * DELETE Handler: Remove a bookmark
 * 
 * URL Parameter:
 * - id: The database bookmark ID (cuid string from Prisma)
 * 
 * Returns:
 * - 200: Success confirmation
 * - 500: Error message if deletion fails
 * 
 * Example:
 * DELETE /api/bookmarks/clx123abc456 - Delete bookmark with ID clx123abc456
 * 
 * Used by:
 * - Bookmarks page when user clicks "Remove" button
 * - Story page when user unbookmarks a story
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Extract bookmark ID from URL parameter
    // Next.js 15+ requires awaiting params
    const { id } = await params;

    // Delete bookmark from database
    // Prisma will throw an error if bookmark doesn't exist
    await prisma.bookmark.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to delete bookmark', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET Handler: Check if a story is bookmarked
 * 
 * URL Parameter:
 * - id: The Hacker News story ID (number)
 * 
 * Returns:
 * - 200: Bookmark object if found, or { bookmark: null } if not found
 * - 400: Invalid story ID (not a number)
 * - 500: Database error
 * 
 * Example:
 * GET /api/bookmarks/38471822 - Check if story 38471822 is bookmarked
 * 
 * Used by:
 * - Story list page to show bookmark status for each story
 * - Story detail page to show bookmark button state
 * 
 * Note: This endpoint uses storyId (not database ID) for lookup
 * because the UI needs to check bookmark status by story ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Extract story ID from URL parameter
    const { id } = await params;
    const storyId = parseInt(id);

    // Validate that ID is a valid number
    if (isNaN(storyId)) {
      return NextResponse.json(
        { error: 'Invalid story ID' },
        { status: 400 }
      );
    }

    // Look up bookmark by story ID
    // Returns null if not found (which is valid - story not bookmarked)
    const bookmark = await prisma.bookmark.findUnique({
      where: { storyId },
    });

    // Always return 200, even if bookmark not found
    // The client checks if bookmark is null
    return NextResponse.json({ bookmark });
  } catch (error) {
    console.error('Error fetching bookmark:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch bookmark', details: errorMessage },
      { status: 500 }
    );
  }
}
