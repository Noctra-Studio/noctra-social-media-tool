import type { InstagramCarouselSlide } from '@/lib/social-content'

type GradientStyle = NonNullable<InstagramCarouselSlide['gradient_style']>
type SolidColor = string

export type VisualEditorDraftBackground = {
  type: 'image' | 'gradient' | 'solid'
  imageThumb?: string
  imageUrl?: string
  photographer?: string
  gradientStyle?: GradientStyle
  solidColor?: SolidColor
}

export type VisualEditorDraft = {
  angle?: string
  background: VisualEditorDraftBackground
  platform: 'instagram'
  query: string
  slide: InstagramCarouselSlide
  totalSlides: number
}

const VISUAL_EDITOR_DRAFT_KEY = 'noctra.visual-editor-draft'

export function writeVisualEditorDraft(draft: VisualEditorDraft) {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(VISUAL_EDITOR_DRAFT_KEY, JSON.stringify(draft))
}

export function consumeVisualEditorDraft(): VisualEditorDraft | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.sessionStorage.getItem(VISUAL_EDITOR_DRAFT_KEY)

  if (!raw) {
    return null
  }

  window.sessionStorage.removeItem(VISUAL_EDITOR_DRAFT_KEY)

  try {
    const parsed = JSON.parse(raw) as Partial<VisualEditorDraft>

    if (
      parsed.platform !== 'instagram' ||
      typeof parsed.query !== 'string' ||
      !parsed.slide ||
      typeof parsed.slide !== 'object' ||
      typeof parsed.totalSlides !== 'number' ||
      !parsed.background ||
      typeof parsed.background !== 'object'
    ) {
      return null
    }

    return parsed as VisualEditorDraft
  } catch {
    return null
  }
}
