export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer'
export type WorkspacePlan = 'free' | 'starter' | 'pro' | 'agency' | 'enterprise'
export type WorkspaceStatus = 'active' | 'suspended' | 'cancelled'
export type NoctraRole = 'user' | 'noctra_admin'
export type WorkspaceAssistanceLevel = 'minimal' | 'balanced' | 'full'
export type WorkspacePlatform = 'instagram' | 'linkedin' | 'x' | 'facebook'
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'archived'
export type InsightType =
  | 'topic'
  | 'format'
  | 'tone'
  | 'timing'
  | 'hashtag'
  | 'cta'
  | 'length'
  | 'general'

export interface WorkspaceConfig {
  always_include_cta: boolean
  assistance_level: WorkspaceAssistanceLevel
  brand_description: string | null
  brand_name: string | null
  brand_values: string[] | null
  cta_style: string | null
  forbidden_words: string[] | null
  hashtag_style: string | null
  industry: string | null
  logo_storage_path: string | null
  logo_url: string | null
  main_goal: string | null
  onboarding_completed: boolean
  posting_frequency: Partial<Record<WorkspacePlatform, number>> | null
  preferred_emojis: boolean
  primary_color: string
  reference_posts: string[] | null
  secondary_color: string
  target_audience: string | null
  text_length_pref: string | null
  tone_of_voice: string
  use_hashtags: boolean
}

export interface WorkspaceContext {
  config: WorkspaceConfig | null
  role: WorkspaceRole
  workspace: {
    id: string
    name: string
    plan: WorkspacePlan
    slug: string
    status: WorkspaceStatus
  }
}
