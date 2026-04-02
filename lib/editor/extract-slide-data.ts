import type { StaticCanvas } from 'fabric'

// ─── Types ────────────────────────────────────────────────────────────────────

export type BackgroundData = {
  type: 'color' | 'gradient' | 'image'
  value: string
}

export type SlideObject = {
  type: 'text' | 'rect' | 'circle' | 'line' | 'image' | 'icon'
  role: string
  /** 0–1 proportional to canvas width */
  x: number
  /** 0–1 proportional to canvas height */
  y: number
  /** 0–1 proportional to canvas width */
  width: number
  /** 0–1 proportional to canvas height */
  height: number
  /** degrees */
  angle: number
  /** 0–1 */
  opacity: number
  /** paint order in the stack */
  zIndex: number

  // ── Text ────────────────────────────────────────────────────────────────────
  text?: string
  fontFamily?: string
  /** effective px at canvas scale (fontSize × scaleX) */
  fontSize?: number
  fontWeight?: string
  fontStyle?: string
  fill?: string
  textAlign?: string
  lineHeight?: number
  /** Fabric charSpacing is in 1/1000 em units */
  charSpacing?: number

  // ── Shape ───────────────────────────────────────────────────────────────────
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number

  // ── Effects ─────────────────────────────────────────────────────────────────
  shadow?: {
    color: string
    blur: number
    offsetX: number
    offsetY: number
  }
}

export type SlideRenderData = {
  background: BackgroundData
  /** 0–0.8 */
  dimming: number
  objects: SlideObject[]
  canvasSize: { width: number; height: number }
}

// ─── Feature detection ────────────────────────────────────────────────────────

/**
 * Returns false if the slide data contains features that Satori cannot render
 * (gradient text fills, unsupported object types, etc.).
 */
export function canUseOGRender(slideData: SlideRenderData): boolean {
  for (const obj of slideData.objects) {
    // Gradient or pattern fills on text are not supported
    if (
      obj.type === 'text' &&
      obj.fill &&
      (obj.fill.includes('gradient') || obj.fill.startsWith('data:'))
    ) {
      return false
    }
  }
  return true
}

// ─── Extraction ───────────────────────────────────────────────────────────────

/**
 * Extracts all design data from a Fabric (Static)Canvas into a plain
 * SlideRenderData object suitable for server-side Vercel OG rendering.
 *
 * Works with both live interactive canvases and canvases loaded via
 * resizeCanvasForPlatform (from fabricJSON).
 */
export function extractSlideData(canvas: StaticCanvas): SlideRenderData {
  const canvasWidth = canvas.width ?? 1080
  const canvasHeight = canvas.height ?? 1080

  // ── Background ──────────────────────────────────────────────────────────────

  let background: BackgroundData

  // Prefer the Fabric native backgroundImage (includes base64 processedUrl)
  const nativeBg = canvas.backgroundImage as any | undefined
  if (nativeBg) {
    const src: string =
      typeof nativeBg.getSrc === 'function'
        ? (nativeBg.getSrc() as string)
        : (nativeBg._element?.src as string | undefined) ?? ''
    background = src
      ? { type: 'image', value: src }
      : { type: 'color', value: '#101417' }
  } else if (canvas.backgroundColor) {
    const bg = canvas.backgroundColor as string
    background = bg.includes('gradient')
      ? { type: 'gradient', value: bg }
      : { type: 'color', value: bg }
  } else {
    background = { type: 'color', value: '#101417' }
  }

  // ── Dimming ─────────────────────────────────────────────────────────────────

  // First try canvas.data (available on live canvases)
  const canvasData = (canvas as any).data as Record<string, any> | undefined
  let dimming: number = canvasData?.backgroundImage?.dimming ?? 0

  // Fall back: parse the dimming rect fill (available after loadFromJSON)
  if (dimming === 0) {
    const dimmingRect = canvas
      .getObjects()
      .find((o) => (o as any).data?.role === 'bg-dimming')

    if (dimmingRect) {
      const fill = (dimmingRect as any).fill as string | undefined
      const match = fill?.match(/rgba\(0,\s*0,\s*0,\s*([\d.]+)\)/)
      if (match) dimming = parseFloat(match[1])
    }
  }

  // ── Objects ─────────────────────────────────────────────────────────────────

  const rawObjects = canvas.getObjects()
  const objects: SlideObject[] = rawObjects
    .filter((obj) => {
      const data = (obj as any).data as Record<string, any> | undefined
      return data?.role !== 'bg-dimming' && (obj as any).id !== 'background-image'
    })
    .map((obj, i) => extractObjectData(obj, canvasWidth, canvasHeight, i))
    .filter((o): o is SlideObject => o !== null)

  return {
    background,
    dimming,
    objects,
    canvasSize: { width: canvasWidth, height: canvasHeight },
  }
}

// ─── Object extraction ────────────────────────────────────────────────────────

function extractObjectData(
  obj: any,
  canvasWidth: number,
  canvasHeight: number,
  zIndex: number
): SlideObject | null {
  const type: string = obj.type ?? 'rect'

  const scaleX: number = obj.scaleX ?? 1
  const scaleY: number = obj.scaleY ?? 1
  const w = (obj.width ?? 0) * scaleX
  const h = (obj.height ?? 0) * scaleY

  // Normalise to top-left origin regardless of originX/Y setting
  let x: number = obj.left ?? 0
  let y: number = obj.top ?? 0
  const originX: string = obj.originX ?? 'left'
  const originY: string = obj.originY ?? 'top'
  if (originX === 'center') x -= w / 2
  else if (originX === 'right') x -= w
  if (originY === 'center') y -= h / 2
  else if (originY === 'bottom') y -= h

  const shadow = obj.shadow
    ? {
        color: (obj.shadow as any).color ?? 'rgba(0,0,0,0.5)',
        blur: (obj.shadow as any).blur ?? 0,
        offsetX: (obj.shadow as any).offsetX ?? 0,
        offsetY: (obj.shadow as any).offsetY ?? 0,
      }
    : undefined

  const role: string = (obj.data as any)?.role ?? type

  const base = {
    role,
    x: x / canvasWidth,
    y: y / canvasHeight,
    width: w / canvasWidth,
    height: h / canvasHeight,
    angle: obj.angle ?? 0,
    opacity: obj.opacity ?? 1,
    zIndex,
    shadow,
  }

  // ── Text ────────────────────────────────────────────────────────────────────
  if (type === 'textbox' || type === 'text' || type === 'i-text') {
    return {
      ...base,
      type: 'text',
      text: obj.text ?? '',
      fontFamily: obj.fontFamily ?? 'Inter',
      // Effective font size at canvas scale
      fontSize: (obj.fontSize ?? 16) * scaleX,
      fontWeight: String(obj.fontWeight ?? '400'),
      fontStyle: obj.fontStyle ?? 'normal',
      fill: typeof obj.fill === 'string' ? obj.fill : '#E0E5EB',
      textAlign: obj.textAlign ?? 'left',
      lineHeight: obj.lineHeight ?? 1.4,
      charSpacing: obj.charSpacing ?? 0,
    }
  }

  // ── Rect ────────────────────────────────────────────────────────────────────
  if (type === 'rect') {
    return {
      ...base,
      type: 'rect',
      backgroundColor: typeof obj.fill === 'string' ? obj.fill : 'transparent',
      borderColor: obj.stroke ?? undefined,
      borderWidth: obj.strokeWidth ?? 0,
      borderRadius: obj.rx ?? 0,
    }
  }

  // ── Circle ──────────────────────────────────────────────────────────────────
  if (type === 'circle') {
    return {
      ...base,
      type: 'circle',
      backgroundColor: typeof obj.fill === 'string' ? obj.fill : 'transparent',
      borderColor: obj.stroke ?? undefined,
      borderWidth: obj.strokeWidth ?? 0,
    }
  }

  // ── Line ────────────────────────────────────────────────────────────────────
  if (type === 'line') {
    return {
      ...base,
      type: 'line',
      borderColor: obj.stroke ?? '#E0E5EB',
      borderWidth: obj.strokeWidth ?? 1,
    }
  }

  // ── Image ───────────────────────────────────────────────────────────────────
  if (type === 'image') {
    const src: string =
      typeof obj.getSrc === 'function'
        ? (obj.getSrc() as string)
        : (obj._element?.src as string | undefined) ?? ''
    if (!src) return null
    return {
      ...base,
      type: 'image',
      fill: src,
    }
  }

  // ── Icons & Logos (Path / Group) ────────────────────────────────────────────
  if (role === 'icon' || role === 'logo' || type === 'path' || type === 'group') {
    try {
      // Export specific object to SVG string
      const svg = obj.toSVG()
      const base64 = btoa(unescape(encodeURIComponent(svg)))
      const dataUrl = `data:image/svg+xml;base64,${base64}`
      
      return {
        ...base,
        type: 'icon',
        fill: dataUrl
      }
    } catch (e) {
      console.warn('[extract] Failed to convert icon to SVG:', e)
    }
  }

  // Unknown / unsupported — skip
  return null
}
