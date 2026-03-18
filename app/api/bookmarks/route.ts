/**
 * Bookmarks API Route Handler
 * 
 * This file handles all bookmark-related API operations:
 * - GET: Fetch bookmarks with optional search
 * - POST: Create a new bookmark
 * 
 * Endpoints:
 * - GET /api/bookmarks - Get all bookmarks
 * - GET /api/bookmarks?search=query - Search bookmarks by title or author
 * - POST /api/bookmarks - Create a new bookmark
 * 
 * @see app/api/bookmarks/[id]/route.ts for DELETE operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * Zod validation schema for bookmark creation
 * 
 * Ensures all required fields are present and have correct types:
 * - storyId: Unique identifier from Hacker News
 * - title: Story title
 * - url: Story URL (can be null for text posts)
 * - author: Story author username
 * - points: Story score/upvotes
 * - commentCount: Number of comments on the story
 */
const bookmarkSchema = z.object({
  storyId: z.number(),
  title: z.string(),
  url: z.string().nullable(),
  author: z.string(),
  points: z.number(),
  commentCount: z.number(),
});

/**
 * GET Handler: Fetch bookmarks with optional search
 * 
 * Query Parameters:
 * - search (optional): Search term to filter bookmarks by title or author
 * 
 * Returns:
 * - 200: Array of bookmarks sorted by creation date (newest first)
 * - 500: Error message if database query fails
 * 
 * Example:
 * GET /api/bookmarks - Get all bookmarks
 * GET /api/bookmarks?search=rust - Search for bookmarks containing "rust"
 */
export async function GET(request: NextRequest) {
  try {
    // Extract search parameter from query string
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    // Query bookmarks from database
    // If search term provided, filter by title or author (case-insensitive)
    // MySQL's LIKE operator is case-insensitive by default
    const bookmarks = await prisma.bookmark.findMany({
      where: search
        ? {
            // OR condition: match either title OR author
            OR: [
              { title: { contains: search } },
              { author: { contains: search } },
            ],
          }
        : undefined, // No filter if no search term
      orderBy: { createdAt: 'desc' }, // Newest bookmarks first
    });

    return NextResponse.json({ bookmarks });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks', details: message },
      { status: 500 }
    );
  }
}

/**
 * POST Handler: Create a new bookmark
 * 
 * Request Body:
 * {
 *   storyId: number,
 *   title: string,
 *   url: string | null,
 *   author: string,
 *   points: number,
 *   commentCount: number
 * }
 * 
 * Returns:
 * - 201: Created bookmark object
 * - 400: Validation error (invalid request data)
 * - 409: Conflict (story already bookmarked)
 * - 500: Server error
 * 
 * Process:
 * 1. Parse and validate request body using Zod schema
 * 2. Check if bookmark already exists (prevent duplicates)
 * 3. Create new bookmark in database
 * 4. Return created bookmark with 201 status
 */
export async function POST(request: NextRequest) {
  try {
    // Parse JSON body from request
    const body = await request.json();
    console.log('Bookmark request body:', body);
    
    // Validate request data against schema
    // Throws ZodError if validation fails
    const data = bookmarkSchema.parse(body);
    console.log('Validated bookmark data:', data);

    // Check if this story is already bookmarked
    // storyId is unique, so we can use findUnique
    const existing = await prisma.bookmark.findUnique({
      where: { storyId: data.storyId },
    });

    // Return 409 Conflict if bookmark already exists
    if (existing) {
      console.log('Bookmark already exists for story:', data.storyId);
      return NextResponse.json(
        { error: 'Story already bookmarked' },
        { status: 409 }
      );
    }

    // Create new bookmark in database
    console.log('Creating bookmark for story:', data.storyId);
    const bookmark = await prisma.bookmark.create({
      data,
    });

    console.log('Bookmark created successfully:', bookmark.id);
    // Return 201 Created with the new bookmark
    return NextResponse.json({ bookmark }, { status: 201 });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    // Handle other errors (database, parsing, etc.)
    console.error('Error creating bookmark:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create bookmark', details: message },
      { status: 500 }
    );
  }
}
