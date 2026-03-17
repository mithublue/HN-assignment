export interface HNItem {
  id: number;
  deleted?: boolean;
  type?: 'job' | 'story' | 'comment' | 'poll' | 'pollopt';
  by?: string;
  time?: number;
  text?: string;
  dead?: boolean;
  parent?: number;
  poll?: number;
  kids?: number[];
  url?: string;
  score?: number;
  title?: string;
  parts?: number[];
  descendants?: number;
}

export interface Story extends HNItem {
  type: 'story';
  title: string;
  by: string;
  score: number;
  time: number;
  descendants: number;
}

export interface Comment extends HNItem {
  type: 'comment';
  by: string;
  parent: number;
  text: string;
  time: number;
  replies?: Comment[];
}

export interface Bookmark {
  id: string;
  storyId: number;
  title: string;
  url: string | null;
  author: string;
  points: number;
  commentCount: number;
  createdAt: Date;
}

export interface Summary {
  id: string;
  storyId: number;
  keyPoints: string[];
  sentiment: 'positive' | 'negative' | 'mixed' | 'neutral';
  summary: string;
  createdAt: Date;
}

export type StoryType = 'top' | 'new' | 'best';
