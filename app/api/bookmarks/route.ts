import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const bookmarkSchema = z.object({
  storyId: z.number(),
  title: z.string(),
  url: z.string().nullable(),
  author: z.string(),
  points: z.number(),
  commentCount: z.number(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    const bookmarks = await prisma.bookmark.findMany({
      where: search
        ? {
            OR: [
              { title: { contains: search } },
              { author: { contains: search } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Bookmark request body:', body);
    
    const data = bookmarkSchema.parse(body);
    console.log('Validated bookmark data:', data);

    // Check if bookmark already exists
    const existing = await prisma.bookmark.findUnique({
      where: { storyId: data.storyId },
    });

    if (existing) {
      console.log('Bookmark already exists for story:', data.storyId);
      return NextResponse.json(
        { error: 'Story already bookmarked' },
        { status: 409 }
      );
    }

    console.log('Creating bookmark for story:', data.storyId);
    const bookmark = await prisma.bookmark.create({
      data,
    });

    console.log('Bookmark created successfully:', bookmark.id);
    return NextResponse.json({ bookmark }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating bookmark:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create bookmark', details: message },
      { status: 500 }
    );
  }
}
