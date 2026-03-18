/**
 * Stories List API Route Handler
 * 
 * This endpoint fetches a list of stories from Hacker News API.
 * Supports three story types: top, new, and best.
 * 
 * Endpoint:
 * GET /api/stories?type=top&limit=30
 * 
 * Query Parameters:
 * - type: 'top' | 'new' | 'best' (default: 'top')
 * - limit: number between 1-100 (default: 30)
 * 
 * Returns:
 * - 200: Array of story objects
 * - 500: Error message if fetch fails
 */

import { NextRequest, NextResponse } from 'next/server';
import { hnAPI } from '@/lib/hn-api';
import { z } from 'zod';

/**
 * Zod validation schema for query parameters
 * 
 * Validates and transforms query parameters:
 * - type: Must be one of 'top', 'new', or 'best'
 * - limit: Must be a number between 1 and 100
 * - Both have default values if not provided
 * 
 * z.coerce.number() automatically converts string to number
 */
const querySchema = z.object({
  type: z.enum(['top', 'new', 'best']).default('top'),
  limit: z.coerce.number().min(1).max(100).default(30),
});

/**
 * GET Handler: Fetch stories from Hacker News
 * 
 * Process:
 * 1. Parse and validate query parameters
 * 2. Fetch stories from HN API using hnAPI client
 * 3. Return stories array
 * 
 * Story Types:
 * - 'top': Most upvoted stories (default)
 * - 'new': Newest stories by submission time
 * - 'best': Best stories (HN's algorithm-ranked)
 * 
 * Example Requests:
 * GET /api/stories - Get top 30 stories
 * GET /api/stories?type=new - Get newest 30 stories
 * GET /api/stories?type=best&limit=50 - Get best 50 stories
 * 
 * Used by:
 * - Home page (app/page.tsx) for story list
 * - Story type tabs (Top/New/Best)
 */
export async function GET(request: NextRequest) {
  try {
    // Extract query parameters from URL
    const searchParams = request.nextUrl.searchParams;
    
    // Parse and validate parameters using Zod schema
    // Throws ZodError if validation fails
    const params = querySchema.parse({
      type: searchParams.get('type') || 'top',
      limit: searchParams.get('limit') || '30',
    });

    // Fetch stories from Hacker News API
    // hnAPI.getStories() handles:
    // - Fetching story IDs for the given type
    // - Fetching full story data for each ID in parallel
    // - Filtering out null/deleted stories
    const stories = await hnAPI.getStories(params.type, params.limit);

    return NextResponse.json({ stories });
  } catch (error) {
    console.error('Error fetching stories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stories' },
      { status: 500 }
    );
  }
}
