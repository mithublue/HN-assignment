import OpenAI from 'openai';
import type { Comment } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface DiscussionSummary {
  keyPoints: string[];
  sentiment: 'positive' | 'negative' | 'mixed' | 'neutral';
  summary: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<p>/g, '\n')
    .replace(/<\/p>/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

export async function summarizeDiscussion(
  comments: Comment[],
  storyTitle: string
): Promise<DiscussionSummary> {
  if (comments.length === 0) {
    return {
      keyPoints: ['No comments yet'],
      sentiment: 'neutral',
      summary: 'This story has no comments yet.',
    };
  }

  // Prepare comment text (limit to top-level and first few replies)
  const commentTexts = comments
    .slice(0, 50) // Limit to first 50 comments to avoid token limits
    .map((c, i) => {
      const text = c.text ? stripHtml(c.text) : '[deleted]';
      return `Comment ${i + 1} by ${c.by}: ${text}`;
    })
    .join('\n\n');

  const prompt = `You are analyzing a Hacker News discussion for the story: "${storyTitle}"

Here are the comments:

${commentTexts}

Please provide:
1. Key points discussed (3-5 bullet points)
2. Overall sentiment (positive, negative, mixed, or neutral)
3. A brief summary (2-3 sentences)

Respond in JSON format:
{
  "keyPoints": ["point 1", "point 2", ...],
  "sentiment": "positive|negative|mixed|neutral",
  "summary": "brief summary text"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes Hacker News discussions. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const result = JSON.parse(content) as DiscussionSummary;
    return result;
  } catch (error) {
    console.error('Error summarizing discussion:', error);
    throw new Error('Failed to generate summary');
  }
}
