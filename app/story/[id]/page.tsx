'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import type { Story, Comment, Summary } from '@/lib/types';

interface CommentItemProps {
  comment: Comment;
  depth?: number;
}

function CommentItem({ comment, depth = 0 }: CommentItemProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={depth > 0 ? 'ml-6 mt-3 border-l-2 border-gray-100 pl-4' : 'mt-4 border-b border-gray-100 pb-4'}>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
        <span className="font-medium text-gray-700">{comment.by}</span>
        <span>·</span>
        <span suppressHydrationWarning>{formatDistanceToNow(new Date(comment.time * 1000), { addSuffix: true })}</span>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-xs text-gray-400 hover:text-gray-600"
        >
          {collapsed ? '[+]' : '[–]'}
        </button>
      </div>
      {!collapsed && (
        <>
          {comment.text && (
            <div
              className="text-gray-800 text-sm leading-relaxed prose prose-sm max-w-none
                [&_a]:text-orange-600 [&_a]:underline [&_a:hover]:text-orange-800
                [&_pre]:bg-gray-100 [&_pre]:p-3 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre]:text-xs
                [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded [&_code]:text-xs
                [&_p]:mb-2 [&_p:last-child]:mb-0
                [&_i]:italic [&_b]:font-semibold"
              dangerouslySetInnerHTML={{ __html: comment.text }}
            />
          )}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface CommentsResponse {
  comments: Comment[];
  total: number;
  page: number;
  totalPages: number;
}

export default function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [commentPage, setCommentPage] = useState(1);

  const { data: storyData, isLoading: storyLoading } = useQuery({
    queryKey: ['story', id],
    queryFn: async () => {
      const res = await axios.get(`/api/stories/${id}`);
      return res.data.story as Story;
    },
  });

  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', id, commentPage],
    queryFn: async () => {
      const res = await axios.get(`/api/comments/${id}?page=${commentPage}`);
      return res.data as CommentsResponse;
    },
  });

  const { data: bookmarkData } = useQuery({
    queryKey: ['bookmark', id],
    queryFn: async () => {
      const res = await axios.get(`/api/bookmarks/${id}`);
      return res.data.bookmark;
    },
  });

  const { data: summaryData } = useQuery({
    queryKey: ['summary', id],
    queryFn: async () => {
      const res = await axios.get(`/api/summarize/${id}`);
      return res.data.summary as Summary | null;
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (!storyData) return;
      const res = await axios.post('/api/bookmarks', {
        storyId: storyData.id,
        title: storyData.title,
        url: storyData.url || null,
        author: storyData.by,
        points: storyData.score,
        commentCount: storyData.descendants || 0,
      });
      return res.data.bookmark;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmark', id] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: unknown }; message?: string };
      console.error('Bookmark error:', err.response?.data || err.message);
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
    onError: (error: unknown) => {
      const err = error as { response?: { data?: unknown }; message?: string };
      console.error('Unbookmark error:', err.response?.data || err.message);
    },
  });

  const summarizeMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post(`/api/summarize/${id}`);
      return res.data.summary as Summary;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summary', id] });
    },
  });

  if (storyLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
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
        {/* Story card */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{storyData.title}</h1>
          {storyData.url && (
            <a
              href={storyData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:text-orange-700 mb-3 inline-block break-all"
            >
              {storyData.url} ↗
            </a>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
            <span>{storyData.score} points</span>
            <span>by {storyData.by}</span>
            <span suppressHydrationWarning>{formatDistanceToNow(new Date(storyData.time * 1000), { addSuffix: true })}</span>
            <span>{storyData.descendants || 0} comments</span>
          </div>
          <div className="flex flex-wrap gap-3">
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
                disabled={summarizeMutation.isPending}
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

        {/* AI Summary */}
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

        {/* Comments */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Comments ({storyData.descendants || 0})
          </h2>

          {commentsLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
              <p className="mt-2 text-gray-600">Loading comments...</p>
            </div>
          )}

          {!commentsLoading && commentsData?.comments.length === 0 && (
            <p className="text-gray-600">No comments yet.</p>
          )}

          {commentsData && commentsData.comments.length > 0 && (
            <>
              <div className="divide-y divide-gray-50">
                {commentsData.comments.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} />
                ))}
              </div>

              {/* Pagination */}
              {commentsData.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setCommentPage((p) => Math.max(1, p - 1))}
                    disabled={commentPage === 1}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {commentPage} of {commentsData.totalPages}
                    <span className="ml-2 text-gray-400">({commentsData.total} top-level comments)</span>
                  </span>
                  <button
                    onClick={() => setCommentPage((p) => Math.min(commentsData.totalPages, p + 1))}
                    disabled={commentPage === commentsData.totalPages}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
