/**
 * AI Summary API Route Handler
 * 
 * This endpoint generates and retrieves AI-powered summaries of HN discussions.
 * Uses Mistral AI to analyze comments and provide:
 * - Key discussion points
 * - Overall sentiment
 * - Brief summary
 * 
 * Endpoints:
 * - POST /api/summarize/[id] - Generate new summary
 * - GET /api/summarize/[id] - Retrieve existing summary
 * 
 * Caching Strategy:
 * - Summaries are stored in database after generation
 * - Subsequent requests return cached summary (no re-generation)
 * - Saves API costs and improves response time
 */

import { NextRequest, NextResponse } from 'next/server';
import { hnAPI } from '@/lib/hn-api';
import { summarizeDiscussion } from '@/lib/openai';
import { prisma } from '@/lib/prisma';

/**
 * POST Handler: Generate AI summary for a story's discussion
 * 
 * Process:
 * 1. Check if summary already exists (return cached if found)
 * 2. Fetch story and all comments from HN API
 * 3. Send comments to Mistral AI for analysis
 * 4. Save summary to database
 * 5. Return summary
 * 
 * URL Parameter:
 * - id: Hacker News story ID
 * 
 * Returns:
 * - 200: Summary object (new or cached)
 * - 400: Invalid story ID
 * - 404: Story not found
 * - 500: Generation failed (AI API error, database error, etc.)
 * 
 * Summary Object:
 * {
 *   id: string,              // Database ID
 *   storyId: number,         // HN story ID
 *   keyPoints: string[],     // 3-5 main discussion points
 *   sentiment: string,       // 'positive', 'negative', 'mixed', 'neutral'
 *   summary: string,         // 2-3 sentence summary
 *   createdAt: Date          // When summary was generated
 * }
 * 
 * Performance Notes:
 * - First request is slow (fetches all comments + AI processing)
 * - Subsequent requests are fast (returns cached summary)
 * - Consider adding a loading state in UI
 * 
 * Cost Considerations:
 * - Each summary generation costs Mistral AI API credits
 * - Caching prevents redundant API calls
 * - Limit to first 50 comments to control costs
 * 
 * Example Request:
 * POST /api/summarize/38471822 - Generate summary for story 38471822
 * 
 * Used by:
 * - Story detail page "Summarize Discussion" button
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Extract and validate story ID
    const { id } = await params;
    const storyId = parseInt(id);

    if (isNaN(storyId)) {
      return NextResponse.json(
        { error: 'Invalid story ID' },
        { status: 400 }
      );
    }

    // Check if summary already exists in database
    // If found, return cached summary (no need to regenerate)
    const existingSummary = await prisma.summary.findUnique({
      where: { storyId },
    });

    if (existingSummary) {
      return NextResponse.json({ summary: existingSummary });
    }

    // Fetch story metadata from HN API
    const story = await hnAPI.getStory(storyId);
    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    // Fetch ALL comments for the story (flattened, not nested)
    // This can be slow for stories with many comments
    // getAllComments() uses breadth-first search to fetch entire tree
    const comments = await hnAPI.getAllComments(storyId);

    // Generate AI summary using Mistral AI
    // summarizeDiscussion() handles:
    // - Stripping HTML from comments
    // - Limiting to first 50 comments (token limit)
    // - Sending to Mistral AI with structured prompt
    // - Parsing JSON response
    const summaryData = await summarizeDiscussion(comments, story.title);

    // Save summary to database for future requests
    const summary = await prisma.summary.create({
      data: {
        storyId,
        keyPoints: summaryData.keyPoints,
        sentiment: summaryData.sentiment,
        summary: summaryData.summary,
      },
    });

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}

/**
 * GET Handler: Retrieve existing summary
 * 
 * Checks if a summary exists for the given story.
 * Does NOT generate a new summary if not found.
 * 
 * URL Parameter:
 * - id: Hacker News story ID
 * 
 * Returns:
 * - 200: Summary object or { summary: null } if not found
 * - 400: Invalid story ID
 * - 500: Database error
 * 
 * Example Request:
 * GET /api/summarize/38471822 - Check if summary exists
 * 
 * Used by:
 * - Story detail page on initial load
 * - To show/hide "Summarize" button
 * - To display existing summary if available
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Extract and validate story ID
    const { id } = await params;
    const storyId = parseInt(id);

    if (isNaN(storyId)) {
      return NextResponse.json(
        { error: 'Invalid story ID' },
        { status: 400 }
      );
    }

    // Look up summary in database
    // Returns null if not found (which is valid - no summary yet)
    const summary = await prisma.summary.findUnique({
      where: { storyId },
    });

    // Always return 200, even if summary is null
    // The client checks if summary is null to show/hide UI elements
    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error fetching summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch summary' },
      { status: 500 }
    );
  }
}
