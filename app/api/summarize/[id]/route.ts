import { NextRequest, NextResponse } from 'next/server';
import { hnAPI } from '@/lib/hn-api';
import { summarizeDiscussion } from '@/lib/openai';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const storyId = parseInt(id);

    if (isNaN(storyId)) {
      return NextResponse.json(
        { error: 'Invalid story ID' },
        { status: 400 }
      );
    }

    // Check if summary already exists
    const existingSummary = await prisma.summary.findUnique({
      where: { storyId },
    });

    if (existingSummary) {
      return NextResponse.json({ summary: existingSummary });
    }

    // Fetch story and comments
    const story = await hnAPI.getStory(storyId);
    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    const comments = await hnAPI.getAllComments(storyId);

    // Generate summary
    const summaryData = await summarizeDiscussion(comments, story.title);

    // Save to database
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const storyId = parseInt(id);

    if (isNaN(storyId)) {
      return NextResponse.json(
        { error: 'Invalid story ID' },
        { status: 400 }
      );
    }

    const summary = await prisma.summary.findUnique({
      where: { storyId },
    });

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error fetching summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch summary' },
      { status: 500 }
    );
  }
}
