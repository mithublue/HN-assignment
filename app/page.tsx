'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import type { Story, StoryType } from '@/lib/types';

export default function Home() {
  const [storyType, setStoryType] = useState<StoryType>('top');
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['stories', storyType],
    queryFn: async () => {
      const response = await axios.get(`/api/stories?type=${storyType}&limit=30`);
      return response.data.stories as Story[];
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-orange-500 text-white p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Smart Hacker News Reader</h1>
          <p className="text-sm opacity-90">AI-powered discussion summaries</p>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex gap-4">
            <button
              onClick={() => setStoryType('top')}
              className={`px-4 py-2 rounded ${
                storyType === 'top'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Top Stories
            </button>
            <button
              onClick={() => setStoryType('new')}
              className={`px-4 py-2 rounded ${
                storyType === 'new'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              New Stories
            </button>
            <button
              onClick={() => setStoryType('best')}
              className={`px-4 py-2 rounded ${
                storyType === 'best'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Best Stories
            </button>
            <Link
              href="/bookmarks"
              className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 ml-auto"
            >
              My Bookmarks
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <p className="mt-4 text-gray-600">Loading stories...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error loading stories. Please try again.
          </div>
        )}

        {data && (
          <div className="space-y-4">
            {data.map((story, index) => (
              <StoryCard key={story.id} story={story} index={index} queryClient={queryClient} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

interface StoryCardProps {
  story: Story;
  index: number;
  queryClient: ReturnType<typeof useQueryClient>;
}

function StoryCard({ story, index, queryClient }: StoryCardProps) {
  const { data: bookmarkData } = useQuery({
    queryKey: ['bookmark', story.id],
    queryFn: async () => {
      const res = await axios.get(`/api/bookmarks/${story.id}`);
      return res.data.bookmark;
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post('/api/bookmarks', {
        storyId: story.id,
        title: story.title,
        url: story.url || null,
        author: story.by,
        points: story.score,
        commentCount: story.descendants || 0,
      });
      return res.data.bookmark;
    },
    onMutate: async () => {
      // Cancel any in-flight refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['bookmark', story.id] });
      const previous = queryClient.getQueryData(['bookmark', story.id]);
      // Optimistically set as bookmarked immediately
      queryClient.setQueryData(['bookmark', story.id], { id: 'optimistic', storyId: story.id });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      // Roll back on failure
      queryClient.setQueryData(['bookmark', story.id], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmark', story.id] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });

  const unbookmarkMutation = useMutation({
    mutationFn: async () => {
      if (!bookmarkData) return;
      await axios.delete(`/api/bookmarks/${bookmarkData.id}`);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['bookmark', story.id] });
      const previous = queryClient.getQueryData(['bookmark', story.id]);
      // Optimistically clear bookmark immediately
      queryClient.setQueryData(['bookmark', story.id], null);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['bookmark', story.id], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmark', story.id] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });

  return (
    <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <span className="text-gray-500 font-mono text-sm">{index + 1}.</span>
        <div className="flex-1">
          <Link
            href={`/story/${story.id}`}
            className="text-lg font-medium text-gray-900 hover:text-orange-600"
          >
            {story.title}
          </Link>
          {story.url && (
            <a
              href={story.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-sm text-gray-500 hover:text-gray-700"
            >
              ({new URL(story.url).hostname})
            </a>
          )}
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
            <span>{story.score} points</span>
            <span>by {story.by}</span>
            <span suppressHydrationWarning>{formatDistanceToNow(new Date(story.time * 1000), { addSuffix: true })}</span>
            <Link
              href={`/story/${story.id}`}
              className="text-orange-600 hover:text-orange-700"
            >
              {story.descendants || 0} comments
            </Link>
          </div>
        </div>
        <div className="flex gap-2">
          {bookmarkData ? (
            <button
              onClick={() => unbookmarkMutation.mutate()}
              disabled={unbookmarkMutation.isPending}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 disabled:opacity-50 whitespace-nowrap"
              title="Remove bookmark"
            >
              {unbookmarkMutation.isPending ? '...' : '★'}
            </button>
          ) : (
            <button
              onClick={() => bookmarkMutation.mutate()}
              disabled={bookmarkMutation.isPending}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50 whitespace-nowrap"
              title="Add bookmark"
            >
              {bookmarkMutation.isPending ? '...' : '☆'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
