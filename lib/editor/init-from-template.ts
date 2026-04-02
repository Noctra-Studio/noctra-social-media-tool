import { Circle, Line, Rect, StaticCanvas, Textbox, type FabricObject } from 'fabric'
import type { InstagramCarouselSlide } from '@/lib/social-content'
import type { SlideTemplate } from './templates'
import { recommendTypeScale, applyTypeScaleToCanvas } from '@/lib/typography/type-scale'

type CanvasWithData = StaticCanvas & { data?: Record<string, unknown> }
type FabricObjectWithData = FabricObject & { data?: Record<string, unknown> }

const TEMPLATE_CANVAS_SIZE = 1080
const DEFAULT_TEXTBOX_WIDTH = 900
const MAX_TEMPLATE_TEXTBOX_WIDTH = 1000
const MAX_TEMPLATE_FONT_SIZE = 120
const FALLBACK_TEMPLATE_FONT_SIZE = 80

export function initSlideFromTemplate(
  canvas: StaticCanvas,
  template: SlideTemplate,
  data: Partial<InstagramCarouselSlide> | null | undefined,
  slideNumber: number,
  isPreview = false
): void {
  canvas.clear()

  const slideData = {
    body: data?.body ?? '',
    headline: data?.headline ?? '',
    stat_or_example: data?.stat_or_example ?? null,
    type: data?.type ?? 'content',
    visual_direction: data?.visual_direction ?? '',
  }

  // Set background
  if (template.canvasBackground.type === 'solid') {
    canvas.backgroundColor = template.canvasBackground.default
  } else if (template.canvasBackground.type === 'gradient') {
    // Basic support for gradient background if needed, otherwise fallback to color
    canvas.backgroundColor = template.canvasBackground.default
  }

  // Add objects
  template.objects.forEach((obj) => {
    let finalObj: FabricObject | null = null

    // Map role to content
    const props = { ...obj.props }
    if (obj.type === 'textbox') {
      const width = typeof props.width === 'number' ? props.width : undefined
      if (!width || width > MAX_TEMPLATE_TEXTBOX_WIDTH) {
        props.width = DEFAULT_TEXTBOX_WIDTH
      }

      // Keep readable template text bounded without shrinking decorative stat/counter elements.
      if (obj.role === 'headline' || obj.role === 'body' || obj.role === 'eyebrow' || obj.role === 'handle') {
        const fontSize = typeof props.fontSize === 'number' ? props.fontSize : undefined
        if (fontSize && fontSize > MAX_TEMPLATE_FONT_SIZE) {
          props.fontSize = FALLBACK_TEMPLATE_FONT_SIZE
        }
      }

      let text = (props.text as string) || ''
      
      switch (obj.role) {
        case 'headline':
          text = slideData.headline || (props.text as string) || ''
          break
        case 'body':
          text = slideData.body || (props.text as string) || ''
          break
        case 'stat':
          text = slideData.stat_or_example || '00'
          break
        case 'eyebrow':
          text = slideData.visual_direction
            ? slideData.visual_direction.toUpperCase()
            : (props.text as string) || ''
          break
        case 'counter':
          text = slideNumber.toString().padStart(2, '0')
          break
        case 'handle':
          text = '@noctra.studio'
          break
        case 'logo':
          text = '◐' // Default Noctra logo character
          break
      }
      
      finalObj = new Textbox(text, props as ConstructorParameters<typeof Textbox>[1])
    } else if (obj.type === 'rect') {
      finalObj = new Rect(props as ConstructorParameters<typeof Rect>[0])
    } else if (obj.type === 'circle') {
      finalObj = new Circle(props as ConstructorParameters<typeof Circle>[0])
    } else if (obj.type === 'line') {
      const linePoints: ConstructorParameters<typeof Line>[0] = [
        typeof props.x1 === 'number' ? props.x1 : 0,
        typeof props.y1 === 'number' ? props.y1 : 0,
        typeof props.x2 === 'number' ? props.x2 : 0,
        typeof props.y2 === 'number' ? props.y2 : 0,
      ]
      finalObj = new Line(linePoints, props as ConstructorParameters<typeof Line>[1])
    }

    if (finalObj) {
      // Special handlings
      const objectWithData = finalObj as FabricObjectWithData
      const data = objectWithData.data || {}
      objectWithData.data = { ...data, role: obj.role }

      if (obj.role === 'logo') {
        finalObj.set({ selectable: false, evented: false })
      }
      
      canvas.add(finalObj)
    }
  })

  if (!isPreview) {
    if (canvas.width !== TEMPLATE_CANVAS_SIZE || canvas.height !== TEMPLATE_CANVAS_SIZE) {
      canvas.setDimensions({ width: TEMPLATE_CANVAS_SIZE, height: TEMPLATE_CANVAS_SIZE })
    }

    const scale = recommendTypeScale(
      slideData.type,
      slideData.headline.length,
      !!slideData.body,
      !!slideData.stat_or_example
    )

    applyTypeScaleToCanvas(canvas, scale)
    const canvasWithData = canvas as CanvasWithData
    canvasWithData.data = { ...canvasWithData.data, typeScale: scale, autoTypeScale: true }
  }

  canvas.renderAll()
}

export function initSlideFromData(
  canvas: StaticCanvas,
  data: InstagramCarouselSlide,
  slideNumber: number,
  template?: SlideTemplate,
  isPreview = false
): void {
  // If no template provided, we should probably have a default or just do nothing
  // For now, if template is missing, we don't clear (user might be using "current layout")
  if (template) {
    initSlideFromTemplate(canvas, template, data, slideNumber, isPreview)
  }
}
