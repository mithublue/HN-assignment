'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import type { Bookmark } from '@/lib/types';

export default function BookmarksPage() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['bookmarks', search],
    queryFn: async () => {
      const url = search
        ? `/api/bookmarks?search=${encodeURIComponent(search)}`
        : '/api/bookmarks';
      const response = await axios.get(url);
      return response.data.bookmarks as Bookmark[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/bookmarks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-orange-500 text-white p-4 shadow-md">
        <div className="container mx-auto">
          <Link href="/" className="text-sm hover:underline">← Back to stories</Link>
          <h1 className="text-2xl font-bold mt-2">My Bookmarks</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search bookmarks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <p className="mt-4 text-gray-600">Loading bookmarks...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error loading bookmarks. Please try again.
          </div>
        )}

        {data && data.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">No bookmarks yet</p>
            <Link href="/" className="mt-4 inline-block text-orange-600 hover:text-orange-700">
              Browse stories to bookmark
            </Link>
          </div>
        )}

        {data && data.length > 0 && (
          <div className="space-y-4">
            {data.map((bookmark) => (
              <div key={bookmark.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <Link
                      href={`/story/${bookmark.storyId}`}
                      className="text-lg font-medium text-gray-900 hover:text-orange-600"
                    >
                      {bookmark.title}
                    </Link>
                    {bookmark.url && (
                      <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-sm text-gray-500 hover:text-gray-700"
                      >
                        ({new URL(bookmark.url).hostname})
                      </a>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                      <span>{bookmark.points} points</span>
                      <span>by {bookmark.author}</span>
                      <span>{bookmark.commentCount} comments</span>
                      <span>
                        Saved {formatDistanceToNow(new Date(bookmark.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(bookmark.id)}
                    disabled={deleteMutation.isPending}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
