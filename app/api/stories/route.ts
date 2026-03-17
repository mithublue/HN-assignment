import { NextRequest, NextResponse } from 'next/server';
import { hnAPI } from '@/lib/hn-api';
import { z } from 'zod';

const querySchema = z.object({
  type: z.enum(['top', 'new', 'best']).default('top'),
  limit: z.coerce.number().min(1).max(100).default(30),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = querySchema.parse({
      type: searchParams.get('type') || 'top',
      limit: searchParams.get('limit') || '30',
    });

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
