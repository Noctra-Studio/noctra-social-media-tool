import { createClient } from '@/lib/supabase/client';
import { type CarouselEditorSlide } from '@/lib/instagram-carousel-editor';

export type DesignVersion = {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  thumbnail: string;        // base64 PNG of first slide
  slideCount: number;
  slides: CarouselEditorSlide[];
  metadata: {
    postId: string | null;
    platform: string;
    angle: string;
    theme: string | null;
    templateIds: string[];
  };
};

/**
 * Saves a new version of the current design to Supabase (primary) and localStorage (fallback)
 */
export async function saveDesignVersion(params: {
  userId: string;
  postId: string | null;
  name: string;
  description?: string;
  slides: CarouselEditorSlide[];
  metadata: DesignVersion['metadata'];
}): Promise<DesignVersion> {
  const supabase = createClient();
  
  // 1. Prepare the version object
  const firstSlidePreview = params.slides[0]?.previewDataURL || '';
  
  const versionId = crypto.randomUUID();
  const newVersion: DesignVersion = {
    id: versionId,
    name: params.name,
    description: params.description || '',
    createdAt: Date.now(),
    thumbnail: firstSlidePreview,
    slideCount: params.slides.length,
    slides: params.slides,
    metadata: params.metadata
  };

  // 2. Persist to Supabase
  try {
    // Enforcement of limits (optional but recommended: 50 versions per post/user)
    const { count } = await supabase
      .from('design_versions')
      .select('*', { count: 'exact', head: true })
      .eq(params.postId ? 'post_id' : 'user_id', params.postId || params.userId)

    if (count && count >= 50) {
      // Find oldest and delete
      const { data: oldest } = await supabase
        .from('design_versions')
        .select('id')
        .eq(params.postId ? 'post_id' : 'user_id', params.postId || params.userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()
      
      if (oldest) await deleteDesignVersion(oldest.id, params.postId || params.userId)
    }

    const { error } = await supabase
      .from('design_versions')
      .insert({
        id: versionId,
        user_id: params.userId,
        post_id: params.postId,
        name: params.name,
        description: params.description,
        thumbnail: firstSlidePreview,
        slide_count: params.slides.length,
        data: newVersion
      });

    if (error) throw error;
  } catch (err) {
    console.error('[versions] Failed to save to Supabase, falling back to local:', err);
    // 3. Fallback to localStorage
    saveToLocalStorage(params.postId || 'standalone', newVersion);
  }

  return newVersion;
}

/**
 * Deletes a specific version
 */
export async function deleteDesignVersion(versionId: string, contextId: string): Promise<void> {
  const supabase = createClient();
  
  // 1. Supabase delete
  try {
    const { error } = await supabase
      .from('design_versions')
      .delete()
      .eq('id', versionId);
    
    if (error) throw error;
  } catch (err) {
    console.error('[versions] Supabase delete failed:', err);
  }

  // 2. Local delete
  if (typeof window !== 'undefined') {
    const key = `noctra:versions:${contextId}`;
    const existingRaw = window.localStorage.getItem(key);
    if (existingRaw) {
      const existing: DesignVersion[] = JSON.parse(existingRaw);
      const updated = existing.filter(v => v.id !== versionId);
      window.localStorage.setItem(key, JSON.stringify(updated));
    }
  }
}

/**
 * Lists all versions for a given post
 */
export async function listDesignVersions(postId: string | null): Promise<DesignVersion[]> {
  const supabase = createClient();
  
  // 1. Try Supabase first
  try {
    const { data, error } = await supabase
      .from('design_versions')
      .select('data')
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (data && data.length > 0) {
      return data.map((row: any) => row.data as DesignVersion);
    }
  } catch (err) {
    console.warn('[versions] Supabase list failed, reading local:', err);
  }

  // 2. Fallback / Merge with localStorage
  return getFromLocalStorage(postId || 'standalone');
}

/**
 * Restores a specific version object into the editor format
 */
export function versionToSlides(version: DesignVersion): CarouselEditorSlide[] {
  return version.slides;
}

// --- Local Storage Helpers ---

function saveToLocalStorage(postId: string, version: DesignVersion) {
  if (typeof window === 'undefined') return;
  const key = `noctra:versions:${postId}`;
  const existingRaw = window.localStorage.getItem(key);
  const existing: DesignVersion[] = existingRaw ? JSON.parse(existingRaw) : [];
  
  // Keep last 20 local versions
  const updated = [version, ...existing].slice(0, 20);
  window.localStorage.setItem(key, JSON.stringify(updated));
}

function getFromLocalStorage(postId: string): DesignVersion[] {
  if (typeof window === 'undefined') return [];
  const key = `noctra:versions:${postId}`;
  const raw = window.localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}
