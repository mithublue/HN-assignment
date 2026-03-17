'use client';

import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import type { Story, Comment, Summary } from '@/lib/types';

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

interface CommentTreeProps {
  comment: Comment;
  depth?: number;
}

function CommentTree({ comment, depth = 0 }: CommentTreeProps) {
  return (
    <div className={`${depth > 0 ? 'ml-6 mt-3 border-l-2 border-gray-200 pl-4' : 'mt-4'}`}>
      <div className="text-sm text-gray-600 mb-1">
        <span className="font-medium">{comment.by}</span>
        {' · '}
        <span>{formatDistanceToNow(new Date(comment.time * 1000), { addSuffix: true })}</span>
      </div>
      {comment.text && (
        <div className="text-gray-800 whitespace-pre-wrap">
          {stripHtml(comment.text)}
        </div>
      )}
    </div>
  );
}

export default function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const { data: storyData, isLoading: storyLoading } = useQuery({
    queryKey: ['story', id],
    queryFn: async () => {
      const response = await axios.get(`/api/stories/${id}`);
      return response.data.story as Story;
    },
  });

  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', id],
    queryFn: async () => {
      const response = await axios.get(`/api/comments/${id}`);
      return response.data.comments as Comment[];
    },
  });

  const { data: bookmarkData } = useQuery({
    queryKey: ['bookmark', id],
    queryFn: async () => {
      const response = await axios.get(`/api/bookmarks/${id}`);
      return response.data.bookmark;
    },
  });

  const { data: summaryData } = useQuery({
    queryKey: ['summary', id],
    queryFn: async () => {
      const response = await axios.get(`/api/summarize/${id}`);
      return response.data.summary as Summary | null;
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (!storyData) return;
      await axios.post('/api/bookmarks', {
        storyId: storyData.id,
        title: storyData.title,
        url: storyData.url || null,
        author: storyData.by,
        points: storyData.score,
        commentCount: storyData.descendants || 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmark', id] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });

  const unbookmarkMutation = useMutation({
    mutationFn: async () => {
      if (!bookmarkData) return;
      await axios.delete(`/api/bookmarks/${bookmarkData.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmark', id] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });

  const summarizeMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(`/api/summarize/${id}`);
      return response.data.summary as Summary;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summary', id] });
    },
  });

  if (storyLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-gray-600">Loading story...</p>
        </div>
      </div>
    );
  }

  if (!storyData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Story not found</p>
          <Link href="/" className="mt-4 inline-block text-orange-600 hover:text-orange-700">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-orange-500 text-white p-4 shadow-md">
        <div className="container mx-auto">
          <Link href="/" className="text-sm hover:underline">← Back to stories</Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{storyData.title}</h1>
          {storyData.url && (
            <a
              href={storyData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:text-orange-700 mb-3 inline-block"
            >
              {storyData.url} ↗
            </a>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <span>{storyData.score} points</span>
            <span>by {storyData.by}</span>
            <span>{formatDistanceToNow(new Date(storyData.time * 1000), { addSuffix: true })}</span>
            <span>{storyData.descendants || 0} comments</span>
          </div>
          <div className="flex gap-3">
            {bookmarkData ? (
              <button
                onClick={() => unbookmarkMutation.mutate()}
                disabled={unbookmarkMutation.isPending}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                {unbookmarkMutation.isPending ? 'Removing...' : '★ Bookmarked'}
              </button>
            ) : (
              <button
                onClick={() => bookmarkMutation.mutate()}
                disabled={bookmarkMutation.isPending}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {bookmarkMutation.isPending ? 'Saving...' : '☆ Bookmark'}
              </button>
            )}
            {!summaryData && (
              <button
                onClick={() => summarizeMutation.mutate()}
                disabled={summarizeMutation.isPending || commentsLoading}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                {summarizeMutation.isPending ? 'Summarizing...' : '🤖 Summarize Discussion'}
              </button>
            )}
          </div>
        </div>

        {summarizeMutation.error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            Failed to generate summary. Please try again.
          </div>
        )}

        {summaryData && (
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">AI Discussion Summary</h2>
            <div className="mb-4">
              <span className="text-sm font-medium text-gray-700">Sentiment: </span>
              <span className={`px-2 py-1 rounded text-sm ${
                summaryData.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                summaryData.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                summaryData.sentiment === 'mixed' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {summaryData.sentiment}
              </span>
            </div>
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 mb-2">Key Points:</h3>
              <ul className="list-disc list-inside space-y-1">
                {summaryData.keyPoints.map((point, i) => (
                  <li key={i} className="text-gray-700">{point}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Summary:</h3>
              <p className="text-gray-700">{summaryData.summary}</p>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Comments ({storyData.descendants || 0})
          </h2>
          {commentsLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <p className="mt-2 text-gray-600">Loading comments...</p>
            </div>
          )}
          {commentsData && commentsData.length === 0 && (
            <p className="text-gray-600">No comments yet.</p>
          )}
          {commentsData && commentsData.length > 0 && (
            <div className="space-y-4">
              {commentsData.map((comment) => (
                <CommentTree key={comment.id} comment={comment} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
