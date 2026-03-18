/**
 * Individual Story API Route Handler
 * 
 * This endpoint fetches a single story's details from Hacker News API.
 * 
 * Endpoint:
 * GET /api/stories/[id]
 * 
 * URL Parameter:
 * - id: Hacker News story ID (number)
 * 
 * Returns:
 * - 200: Story object with full details
 * - 400: Invalid story ID (not a number)
 * - 404: Story not found
 * - 500: Server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { hnAPI } from '@/lib/hn-api';

/**
 * GET Handler: Fetch a single story by ID
 * 
 * Process:
 * 1. Extract and validate story ID from URL
 * 2. Fetch story from HN API
 * 3. Return story object or error
 * 
 * Story Object includes:
 * - id: Story ID
 * - title: Story title
 * - url: External URL (if link post)
 * - by: Author username
 * - score: Number of upvotes
 * - time: Unix timestamp
 * - descendants: Total comment count
 * - kids: Array of top-level comment IDs
 * 
 * Example Request:
 * GET /api/stories/38471822 - Get story with ID 38471822
 * 
 * Used by:
 * - Story detail page (app/story/[id]/page.tsx)
 * - To display story metadata and comment count
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Extract story ID from URL parameter
    // Next.js 15+ requires awaiting params
    const { id } = await params;
    const storyId = parseInt(id);

    // Validate that ID is a valid number
    if (isNaN(storyId)) {
      return NextResponse.json(
        { error: 'Invalid story ID' },
        { status: 400 }
      );
    }

    // Fetch story from Hacker News API
    // Returns null if story doesn't exist or is deleted
    const story = await hnAPI.getStory(storyId);

    // Return 404 if story not found
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
