/**
 * Hacker News API Client
 * 
 * This module provides a type-safe wrapper around the official Hacker News API.
 * 
 * API Documentation: https://github.com/HackerNews/API
 * 
 * Key features:
 * - Fetches stories (top, new, best)
 * - Retrieves individual stories and comments
 * - Handles nested comment trees
 * - Type-safe with TypeScript interfaces
 * 
 * Rate limiting: The HN API has no official rate limits, but be respectful
 * Caching: Consider implementing caching for production use
 */

import axios from 'axios';
import type { HNItem, Story, Comment, StoryType } from './types';

/**
 * Base URL for Hacker News Firebase API
 * All endpoints are relative to this URL
 */
const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';

/**
 * Hacker News API Client Class
 * 
 * Provides methods to interact with the Hacker News API
 * All methods are async and return Promises
 */
export class HackerNewsAPI {
  /**
   * Fetches a single item (story, comment, etc.) from HN API
   * 
   * @param id - The unique ID of the item
   * @returns The item data or null if not found/error
   * @private
   */
  private async fetchItem<T = HNItem>(id: number): Promise<T | null> {
    try {
      const response = await axios.get(`${HN_API_BASE}/item/${id}.json`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching item ${id}:`, error);
      return null;
    }
  }

  /**
   * Fetches story IDs for a given story type
   * 
   * Story types:
   * - 'top': Top stories (most upvoted)
   * - 'new': Newest stories
   * - 'best': Best stories (algorithm-ranked)
   * 
   * @param type - The type of stories to fetch
   * @returns Array of story IDs (up to 500)
   */
  async getStoryIds(type: StoryType): Promise<number[]> {
    try {
      const response = await axios.get(`${HN_API_BASE}/${type}stories.json`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${type} stories:`, error);
      return [];
    }
  }

  /**
   * Fetches a single story by ID
   * 
   * @param id - The story ID
   * @returns Story object or null if not found
   */
  async getStory(id: number): Promise<Story | null> {
    return this.fetchItem<Story>(id);
  }

  /**
   * Fetches a single comment by ID
   * 
   * @param id - The comment ID
   * @returns Comment object or null if not found
   */
  async getComment(id: number): Promise<Comment | null> {
    return this.fetchItem<Comment>(id);
  }

  /**
   * Fetches multiple stories with full data
   * 
   * Process:
   * 1. Get story IDs for the given type
   * 2. Fetch full story data for each ID in parallel
   * 3. Filter out null results (deleted/not found)
   * 
   * @param type - The type of stories to fetch
   * @param limit - Maximum number of stories to return (default: 30)
   * @returns Array of Story objects
   */
  async getStories(type: StoryType, limit: number = 30): Promise<Story[]> {
    const ids = await this.getStoryIds(type);
    const storyIds = ids.slice(0, limit);
    
    // Fetch all stories in parallel for better performance
    const stories = await Promise.all(
      storyIds.map(id => this.getStory(id))
    );
    
    // Filter out null results (deleted or not found stories)
    return stories.filter((story): story is Story => story !== null);
  }

  /**
   * Fetches a flat list of comments by their IDs
   * 
   * Used internally for building comment trees
   * 
   * @param commentIds - Array of comment IDs to fetch
   * @returns Array of Comment objects (nulls filtered out)
   */
  async getCommentTree(commentIds: number[]): Promise<Comment[]> {
    const comments = await Promise.all(
      commentIds.map(id => this.getComment(id))
    );
    
    return comments.filter((comment): comment is Comment => comment !== null);
  }

  /**
   * Fetches ALL comments for a story (flattened)
   * 
   * This method recursively fetches all comments and their replies
   * using a breadth-first search approach.
   * 
   * Warning: For stories with many comments, this can be slow
   * Consider using pagination or limiting depth in production
   * 
   * @param storyId - The story ID
   * @returns Array of all comments (flattened, not nested)
   */
  async getAllComments(storyId: number): Promise<Comment[]> {
    const story = await this.getStory(storyId);
    if (!story || !story.kids) return [];

    const allComments: Comment[] = [];
    const queue = [...story.kids]; // Queue of comment IDs to fetch

    // Breadth-first search through comment tree
    while (queue.length > 0) {
      const commentId = queue.shift()!;
      const comment = await this.getComment(commentId);
      
      if (comment) {
        allComments.push(comment);
        // Add child comments to queue
        if (comment.kids) {
          queue.push(...comment.kids);
        }
      }
    }

    return allComments;
  }
}

/**
 * Singleton instance of HackerNewsAPI
 * Import and use this instance throughout the application
 * 
 * Example:
 * ```typescript
 * import { hnAPI } from '@/lib/hn-api';
 * const stories = await hnAPI.getStories('top', 10);
 * ```
 */
export const hnAPI = new HackerNewsAPI();
