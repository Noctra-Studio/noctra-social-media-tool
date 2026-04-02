import { Circle, Line, Rect, StaticCanvas, Textbox, type FabricObject } from 'fabric'
import type { InstagramCarouselSlide } from '@/lib/social-content'
import type { SlideTemplate } from './templates'
import { recommendTypeScale, applyTypeScaleToCanvas } from '@/lib/typography/type-scale'

export function initSlideFromTemplate(
  canvas: StaticCanvas,
  template: SlideTemplate,
  data: Partial<InstagramCarouselSlide> | null | undefined,
  slideNumber: number
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
      let text = (props.text as string) || ''
      
      switch (obj.role) {
        case 'headline':
          text = slideData.headline
          break
        case 'body':
          text = slideData.body
          break
        case 'stat':
          text = slideData.stat_or_example || '00'
          break
        case 'eyebrow':
          text = slideData.visual_direction.toUpperCase()
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
      
      finalObj = new Textbox(text, props as any)
    } else if (obj.type === 'rect') {
      finalObj = new Rect(props as any)
    } else if (obj.type === 'circle') {
      finalObj = new Circle(props as any)
    } else if (obj.type === 'line') {
      const lineProps = props as any
      finalObj = new Line([lineProps.x1, lineProps.y1, lineProps.x2, lineProps.y2], props as any)
    }

    if (finalObj) {
      // Special handlings
      const data = (finalObj as any).data || {}
      ;(finalObj as any).data = { ...data, role: obj.role }

      if (obj.role === 'logo') {
        finalObj.set({ selectable: false, evented: false })
      }
      
      canvas.add(finalObj)
    }
  })

  // Calculate and apply type scale automatically
  const scale = recommendTypeScale(
    slideData.type,
    slideData.headline.length,
    !!slideData.body,
    !!slideData.stat_or_example
  )
  
  applyTypeScaleToCanvas(canvas, scale)
  
  // Store scale in canvas data for reference
  ;(canvas as any).data = { ...(canvas as any).data, typeScale: scale, autoTypeScale: true }

  canvas.renderAll()
}

export function initSlideFromData(
  canvas: StaticCanvas,
  data: InstagramCarouselSlide,
  slideNumber: number,
  template?: SlideTemplate
): void {
  // If no template provided, we should probably have a default or just do nothing
  // For now, if template is missing, we don't clear (user might be using "current layout")
  if (template) {
    initSlideFromTemplate(canvas, template, data, slideNumber)
  }
}
