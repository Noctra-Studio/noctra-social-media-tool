import { Canvas, Gradient, StaticCanvas, type FabricObject, type FabricImage } from 'fabric'
import type { CarouselTheme } from './carousel-theme'
import { 
  type SlideEditorState, 
  type CarouselEditorSlide,
  type CarouselEditorBackground 
} from '@/lib/instagram-carousel-editor'
import { gradientStopsToColorStops, getLogoVariant } from '@/lib/carousel-backgrounds'

const CANVAS_SIZE = 1080

function getLogoURL(variant: 'light' | 'dark') {
  return `/brand/favicon-${variant}.svg`
}

export async function applyThemeToCanvas(
  canvas: Canvas | StaticCanvas,
  theme: CarouselTheme,
  slideType: 'cover' | 'content' | 'cta',
  slideNumber?: number
): Promise<void> {
  const objects = canvas.getObjects()
  
  // 1. Apply background
  let newBackground: CarouselEditorBackground
  if (slideType === 'cover' || slideType === 'cta') {
    newBackground = {
      type: 'gradient',
      gradientConfig: {
        angle: 145,
        stops: [theme.primary, theme.secondary],
        type: 'linear'
      }
    }
  } else {
    // Content slides: toggle between primary and secondary
    const isEven = (slideNumber ?? 1) % 2 === 0
    newBackground = {
      type: 'solid',
      solidColor: isEven ? theme.secondary : theme.primary
    }
  }

  // Update background object if it exists
  const bgBase = objects.find(obj => (obj as any).id === 'background-base')
  if (bgBase) {
    if (newBackground.type === 'solid') {
      bgBase.set('fill', theme.primary)
    } else if (newBackground.type === 'gradient' && newBackground.gradientConfig) {
      bgBase.set('fill', new Gradient({
        type: 'linear',
        coords: { x1: 0, y1: 0, x2: CANVAS_SIZE, y2: CANVAS_SIZE },
        colorStops: gradientStopsToColorStops(newBackground.gradientConfig.stops)
      }))
    }
  }

  // 2. Apply typography and accent colors to objects
  for (const obj of objects) {
    const data = (obj as any).data || {}
    const role = data.role

    if (!role) continue

    switch (role) {
      case 'headline':
      case 'stat':
        obj.set({
          fill: theme.text,
          fontFamily: theme.fontHeading
        })
        break
      case 'body':
      case 'eyebrow':
      case 'handle':
        obj.set({
          fill: theme.textMuted,
          fontFamily: theme.fontBody
        })
        break
      case 'counter':
        obj.set({
          fill: theme.accent,
          fontFamily: theme.fontHeading
        })
        break
      case 'decorator':
        if ((obj as any).type === 'line' || (obj as any).strokeWidth > 0) {
          obj.set('stroke', theme.accent)
        }
        obj.set('fill', theme.accent)
        break
      case 'logo':
        // If it's a character-based logo (Textbox)
        if ((obj as any).type === 'textbox') {
          obj.set('fill', theme.textMuted)
        } 
        // If it's an image-based logo
        else if ((obj as any).type === 'image') {
          const variant = getLogoVariant(theme.primary)
          await (obj as FabricImage).setSrc(getLogoURL(variant))
        }
        break
    }
  }

  canvas.renderAll()
}

export async function applyThemeToAllSlides(
  slides: CarouselEditorSlide[],
  theme: CarouselTheme
): Promise<CarouselEditorSlide[]> {
  const updatedSlides = [...slides]
  
  const promises = updatedSlides.map(async (slide, index) => {
    if (!slide.fabricJSON) return slide

    const offscreenCanvas = new StaticCanvas(undefined, {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE
    })

    try {
      await offscreenCanvas.loadFromJSON(slide.fabricJSON)
      
      // We need to know if it's cover/content/cta
      const slideType = slide.type
      const slideNumber = slide.originalData.slide_number

      await applyThemeToCanvas(offscreenCanvas, theme, slideType, slideNumber)

      // Update background metadata
      let background: CarouselEditorBackground
      if (slideType === 'cover' || slideType === 'cta') {
        background = {
          type: 'gradient',
          gradientConfig: {
            angle: 145,
            stops: [theme.primary, theme.secondary],
            type: 'linear'
          }
        }
      } else {
        background = {
          type: 'solid',
          solidColor: slideNumber % 2 === 0 ? theme.secondary : theme.primary
        }
      }

      return {
        ...slide,
        background,
        fabricJSON: JSON.stringify(offscreenCanvas.toJSON()),
        previewDataURL: offscreenCanvas.toDataURL({ format: 'webp', quality: 0.5 } as any)
      }
    } finally {
      offscreenCanvas.dispose()
    }
  })

  return Promise.all(promises)
}
