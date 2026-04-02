import type { InstagramCarouselSlide, SlideBackgroundSelection } from '@/lib/social-content'
import {
  BRAND_GRADIENT_SUGGESTIONS,
  normalizeGradientConfig,
  resolveSlideBackground,
  type CarouselGradientConfig,
} from '@/lib/carousel-backgrounds'

export type EditorTool = 'select' | 'text' | 'rect' | 'circle' | 'line' | 'pen'

export type CarouselEditorBackground = {
  gradientConfig?: CarouselGradientConfig
  imageThumb?: string
  imageUrl?: string
  overlayOpacity?: number
  blur?: number
  photographer?: string
  solidColor?: string
  type: 'solid' | 'gradient' | 'image'
}

export type CarouselEditorSlide = {
  background: CarouselEditorBackground
  fabricJSON: string | null
  id: string
  originalData: InstagramCarouselSlide
  previewDataURL: string | null
  type: InstagramCarouselSlide['type']
}

export type SlideHistory = {
  cursor: number
  states: string[]
}

export type SlideEditorState = {
  activeSlideIndex: number
  isDirty: boolean
  slides: CarouselEditorSlide[]
}

export type CarouselEditorSavePayload = {
  activeFilterCSS?: string
  activeFilterId?: string
  editorSlides: CarouselEditorSlide[]
  slideBackgrounds: SlideBackgroundSelection[]
  slides: InstagramCarouselSlide[]
}

export const DEFAULT_EDITOR_GRADIENTS = {
  brand_dark: BRAND_GRADIENT_SUGGESTIONS[0]?.config ?? normalizeGradientConfig(undefined),
  brand_navy: BRAND_GRADIENT_SUGGESTIONS[1]?.config ?? normalizeGradientConfig(undefined),
  brand_subtle: BRAND_GRADIENT_SUGGESTIONS[2]?.config ?? normalizeGradientConfig(undefined),
} as const

export function createSlideId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `slide_${Math.random().toString(36).slice(2, 10)}`
}

export function getDefaultBackgroundForSlide(
  slide: InstagramCarouselSlide,
  selection?: SlideBackgroundSelection
): CarouselEditorBackground {
  const explicitBackground =
    selection?.bg_type === 'image'
      ? { imageUrl: selection.image_url, type: 'image' as const }
      : selection?.bg_type === 'gradient'
        ? {
            gradientConfig:
              selection.gradient_config ??
              (selection.gradient_style
                ? DEFAULT_EDITOR_GRADIENTS[selection.gradient_style as keyof typeof DEFAULT_EDITOR_GRADIENTS]
                : undefined),
            type: 'gradient' as const,
          }
        : selection?.bg_type === 'solid'
          ? { solidColor: selection.solid_color, type: 'solid' as const }
          : undefined

  const resolved = resolveSlideBackground(slide, explicitBackground)

  if (resolved.type === 'image') {
    return {
      imageThumb: selection?.image_url,
      imageUrl: resolved.url,
      overlayOpacity: selection?.overlayOpacity ?? 0.55,
      blur: selection?.blur ?? 0,
      photographer: selection?.photographer,
      type: 'image',
    }
  }

  if (resolved.type === 'gradient') {
    return {
      gradientConfig: resolved.config,
      type: 'gradient',
    }
  }

  return {
    solidColor: resolved.color,
    type: 'solid',
  }
}

export function createEditorSlides(
  slides: InstagramCarouselSlide[],
  backgrounds: SlideBackgroundSelection[] = [],
  existingSlides: CarouselEditorSlide[] = []
) {
  if (existingSlides.length === slides.length && existingSlides.length > 0) {
    return existingSlides.map((slide, index) => ({
      ...slide,
      originalData: {
        ...slides[index],
        slide_number: index + 1,
      },
      type: slides[index]?.type ?? slide.type,
    }))
  }

  return slides.map((slide, index) => {
    const selection = backgrounds.find((item) => item.slide_number === slide.slide_number)

    return {
      background: getDefaultBackgroundForSlide(slide, selection),
      fabricJSON: null,
      id: createSlideId(),
      originalData: {
        ...slide,
        slide_number: index + 1,
      },
      previewDataURL: null,
      type: slide.type,
    } satisfies CarouselEditorSlide
  })
}

export function normalizeSlideNumbers(slides: CarouselEditorSlide[]) {
  return slides.map((slide, index) => ({
    ...slide,
    originalData: {
      ...slide.originalData,
      slide_number: index + 1,
    },
  }))
}

export function editorBackgroundToSelection(
  background: CarouselEditorBackground,
  slideNumber: number
): SlideBackgroundSelection {
  if (background.type === 'image') {
    return {
      slide_number: slideNumber,
      bg_type: 'image',
      image_url: background.imageUrl,
      photographer: background.photographer,
      overlayOpacity: background.overlayOpacity,
      blur: background.blur,
    }
  }

  if (background.type === 'gradient') {
    return {
      slide_number: slideNumber,
      bg_type: 'gradient',
      gradient_config: background.gradientConfig ? normalizeGradientConfig(background.gradientConfig) : undefined,
    }
  }

  return {
    slide_number: slideNumber,
    bg_type: 'solid',
    solid_color: background.solidColor ?? '#101417',
  }
}

export function getEditedSlidePreview(
  editedSlides: CarouselEditorSlide[] | undefined,
  slideNumber: number
) {
  return editedSlides?.find((slide) => slide.originalData.slide_number === slideNumber)?.previewDataURL ?? null
}
