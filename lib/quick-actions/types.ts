import type { Platform } from '@/lib/product';

export type BrandVoiceRow = {
  example_posts: string[] | null;
  forbidden_words: string[] | string | null;
  tone: string | null;
  values: string[] | string | null;
};

export type QuickActionPlanItem = {
  angle: string;
  day: number;
  hook: string;
  platform: Platform;
  savedIdeaId: string;
  why: string;
};

export type QuickActionRepurposeAdaptation = {
  content: Record<string, unknown>;
  platform: Platform;
  savedPostId: string;
};

export type QuickActionViralTrend = {
  angle: string;
  hook: string;
  platform: Platform;
  savedIdeaId: string;
  trend_context: string;
  urgency: 'high' | 'medium' | 'low';
};

export type QuickActionSavedPost = {
  content: Record<string, unknown>;
  platform: Platform;
  savedPostId: string;
};

export type QuickActionThoughtLeadershipPost = QuickActionSavedPost & {
  stance_used: string;
};

export type QuickActionFaqPost = QuickActionSavedPost & {
  question_used: string;
};
