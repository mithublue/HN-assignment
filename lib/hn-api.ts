import axios from 'axios';
import type { HNItem, Story, Comment, StoryType } from './types';

const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';

export class HackerNewsAPI {
  private async fetchItem<T = HNItem>(id: number): Promise<T | null> {
    try {
      const response = await axios.get(`${HN_API_BASE}/item/${id}.json`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching item ${id}:`, error);
      return null;
    }
  }

  async getStoryIds(type: StoryType): Promise<number[]> {
    try {
      const response = await axios.get(`${HN_API_BASE}/${type}stories.json`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${type} stories:`, error);
      return [];
    }
  }

  async getStory(id: number): Promise<Story | null> {
    return this.fetchItem<Story>(id);
  }

  async getComment(id: number): Promise<Comment | null> {
    return this.fetchItem<Comment>(id);
  }

  async getStories(type: StoryType, limit: number = 30): Promise<Story[]> {
    const ids = await this.getStoryIds(type);
    const storyIds = ids.slice(0, limit);
    
    const stories = await Promise.all(
      storyIds.map(id => this.getStory(id))
    );
    
    return stories.filter((story): story is Story => story !== null);
  }

  async getCommentTree(commentIds: number[]): Promise<Comment[]> {
    const comments = await Promise.all(
      commentIds.map(id => this.getComment(id))
    );
    
    return comments.filter((comment): comment is Comment => comment !== null);
  }

  async getAllComments(storyId: number): Promise<Comment[]> {
    const story = await this.getStory(storyId);
    if (!story || !story.kids) return [];

    const allComments: Comment[] = [];
    const queue = [...story.kids];

    while (queue.length > 0) {
      const commentId = queue.shift()!;
      const comment = await this.getComment(commentId);
      
      if (comment) {
        allComments.push(comment);
        if (comment.kids) {
          queue.push(...comment.kids);
        }
      }
    }

    return allComments;
  }
}

export const hnAPI = new HackerNewsAPI();
