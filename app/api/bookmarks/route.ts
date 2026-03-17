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
              { title: { contains: search, mode: 'insensitive' } },
              { author: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ bookmarks });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = bookmarkSchema.parse(body);

    const bookmark = await prisma.bookmark.create({
      data,
    });

    return NextResponse.json({ bookmark }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to create bookmark' },
      { status: 500 }
    );
  }
}
