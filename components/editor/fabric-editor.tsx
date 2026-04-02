"use client";

import Image from 'next/image'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent as ReactDragEvent,
} from 'react'
import {
  Canvas,
  Ellipse,
  FabricObject,
  FabricImage,
  Gradient,
  Group,
  Line,
  Path,
  Rect,
  Shadow,
  StaticCanvas,
  Textbox,
  ActiveSelection,
  filters,
} from 'fabric'
import { makeTextOnArc, makeTextOnCircle } from '@/lib/editor/text-effects'
import { ExportModal } from './export-modal'
import { quickExportCurrentSlide } from '@/lib/editor/export'
import { PreviewModal } from '@/components/editor/preview/preview-modal'
import { exportCanvasUHD, UHD_PRESET, exportMultiPlatformZip } from '@/lib/editor/export-utils'
import { ExportDialog } from '@/components/editor/export/export-dialog'
import { CanvasToolbar } from '@/components/editor/canvas/canvas-toolbar'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Circle as CircleIcon,
  GripVertical,
  Image as ImageIcon,
  Minus,
  MousePointer2,
  RectangleHorizontal,
  Redo2,
  Type,
  Undo2,
  X,
  Sparkles,
  CaseSensitive,
  AlignJustify,
  Palette,
  Plus,
  Grid,
  Ruler,
  Baseline,
  Type as TypeIcon,
  Download,
  Zap,
  Eye,
  Square,
  History as HistoryIcon,
  Monitor,
  PenLine,
} from 'lucide-react'
import { CanvasRuler } from './canvas-ruler'
import type { InstagramCarouselSlide, SlideBackgroundSelection } from '@/lib/social-content'
import {
  BRAND_GRADIENT_SUGGESTIONS,
  gradientStopsToColorStops,
  normalizeGradientConfig,
  type CarouselGradientConfig,
} from '@/lib/carousel-backgrounds'
import {
  CarouselTheme,
  PRESET_THEMES,
  saveCustomTheme,
} from '@/lib/editor/carousel-theme'
import { applyThemeToAllSlides } from '@/lib/editor/apply-theme'
import { getRecentFonts, getSavedGradients } from '@/lib/editor-preferences'
import {
  createEditorSlides,
  createSlideId,
  editorBackgroundToSelection,
  normalizeSlideNumbers,
  type CarouselEditorBackground,
  type CarouselEditorSavePayload,
  type CarouselEditorSlide,
  type EditorTool,
  type SlideHistory,
  type SlideEditorState,
} from '@/lib/instagram-carousel-editor'
import { templates, type SlideTemplate } from '@/lib/editor/templates'
import { initSlideFromTemplate } from '@/lib/editor/init-from-template'
import { PropertiesPanel } from '@/components/editor/properties-panel'
import { ThemePanel } from '@/components/editor/theme-panel'
import { AssetPanel } from '@/components/editor/asset-panel'
import { ImagePanel } from '@/components/editor/image-panel'
import { FilterPanel } from '@/components/editor/canvas/filter-panel'
import { FeedPreview } from '@/components/instagram/feed-preview'
import { CritiquePanel } from '@/components/editor/critique-panel'
import { ConfirmationModal } from './confirmation-modal'
import '@/lib/editor/text-effects'
import { cn } from '@/lib/utils'
import type { Platform } from '@/lib/product'

import { VersionPanel } from './version-panel'
import { saveDesignVersion } from '@/lib/editor/versions'
import { ContextualBar } from './contextual-bar'
import { TextToolbar } from './text-toolbar'
import { addShapeToCanvas } from '@/lib/editor/shape-utils'
import type { ExportOptions } from '@/types/editor'

type LeftTab = 'slides' | 'tema' | 'imagen' | 'filtros' | 'historico'
type RightTab = 'properties' | 'assets'

type FabricEditorProps = {
  platform?: Platform
  angle?: string
  initialActiveSlideIndex: number
  initialBackgrounds?: SlideBackgroundSelection[]
  initialEditedSlides?: CarouselEditorSlide[]
  initialTemplate?: SlideTemplate | null
  initialTemplateApplyToAll?: boolean
  onClose: () => void
  onSave: (payload: CarouselEditorSavePayload) => void
  slides: InstagramCarouselSlide[]
  postId?: string
  userId: string
  caption?: string
  hashtags?: string[]
  initialActiveFilterId?: string
  initialActiveFilterCSS?: string
}

type FabricCanvasRef = Canvas | null

type SerializedSlideSnapshot = {
  background: CarouselEditorBackground
  canvas: Record<string, unknown>
}

type DragState = {
  originX: number
  originY: number
  shape: FabricObject | null
} | null

type PenPoint = {
  x: number
  y: number
}

type CritiqueIssue = {
  element: string
  fix: string
  problem: string
  severity: 'high' | 'low' | 'medium'
}

type CritiqueResult = {
  grade: 'A' | 'B' | 'C' | 'D'
  issues: CritiqueIssue[]
  overall_score: number
  quick_wins: string[]
  strengths: string[]
  summary: string
  thumbnail?: string
  timestamp: number
}

type BackgroundHighlightData = {
  color: string
  enabled: boolean
  padding: number
  radius: number
  rectId?: string | null
}

type GradientStrokeData = {
  angle?: number
  color1?: string
  color2?: string
  enabled?: boolean
}

type PathTextData = {
  enabled?: boolean
  endAngle?: number
  radius?: number
  startAngle?: number
  type?: 'arc' | 'circle' | 'rect'
}

type EditorObjectRole = 'body' | 'counter' | 'decorator' | 'eyebrow' | 'headline' | 'icon' | 'stat' | 'text-highlight'

type EditorObjectData = {
  arcOptions?: {
    endAngle?: number
    radius?: number
    startAngle?: number
  }
  backgroundHighlight?: BackgroundHighlightData
  gradientStroke?: GradientStrokeData
  isLocked?: boolean
  name?: string
  originalText?: string
  originalTextbox?: ReturnType<Textbox['toObject']>
  pathText?: PathTextData
  role?: EditorObjectRole
  textTransform?: 'original' | 'upper'
  type?: 'arc-text' | 'icon'
}

type FabricObjectWithData = FabricObject & {
  data?: EditorObjectData
  fontFamily?: string
  fontSize?: number
  id?: string
  stroke?: string
  strokeWidth?: number
  text?: string
}

type GroupableActiveSelection = ActiveSelection & {
  toGroup: () => Group
}

type UngroupableFabricObject = FabricObject & {
  toActiveSelection?: () => void
  type?: string
}

type PathWithInternals = Path & {
  _setPath?: (path: string, adjustPosition?: boolean) => void
  setDimensions?: () => void
}

type ParsedFabricObject = {
  data?: EditorObjectData
  fill?: string
  fontFamily?: string
  stroke?: string
}

type ParsedFabricJson = {
  canvas?: {
    objects?: ParsedFabricObject[]
  }
  objects?: ParsedFabricObject[]
}

type NoctraEditorDropData = {
  category?: string
  name?: string
  shapeType?: string
  type: 'icon' | 'image' | 'shape'
  url: string
}

type TextboxPropertyUpdate = Partial<Textbox> & {
  backgroundHighlight?: Partial<BackgroundHighlightData>
  gradientStroke?: Partial<GradientStrokeData>
  pathText?: Partial<PathTextData>
}

const CANVAS_SIZE = 1080
const MAX_CANVAS_DISPLAY = 540
const PEN_PREVIEW_ID = 'pen-preview'
const SLIDE_TYPE_LABELS: Record<InstagramCarouselSlide['type'], string> = {
  cover: 'Portada',
  content: 'Contenido',
  cta: 'CTA',
}
const TOOL_BUTTON_CLASS =
  'flex h-9 w-9 items-center justify-center rounded-xl border text-[#8D95A6] transition-colors hover:border-[#4E576A] hover:text-[#E0E5EB]'
const PANEL_CLASS = 'rounded-[24px] border border-white/8 bg-[#10151A]'

FabricObject.customProperties = ['id', 'slideType', 'isLocked', 'data', 'shadow', 'styles', 'paintFirst']
FabricObject.ownDefaults = {
  ...FabricObject.ownDefaults,
  borderColor: '#462D6E',
  borderScaleFactor: 1.5,
  cornerColor: '#E0E5EB',
  cornerSize: 12,
  cornerStrokeColor: '#462D6E',
  cornerStyle: 'circle',
  padding: 6,
  transparentCorners: false,
}

function getScaleForCanvas(viewportWidth: number, viewportHeight: number) {
  const side = Math.min(MAX_CANVAS_DISPLAY, viewportWidth - 120, viewportHeight - 180)
  return Math.max(0.24, Math.min(side / CANVAS_SIZE, 0.5))
}

function ensureCanvasHasDesignSize(canvas: Canvas | StaticCanvas) {
  if (canvas.width !== CANVAS_SIZE || canvas.height !== CANVAS_SIZE) {
    canvas.setWidth(CANVAS_SIZE)
    canvas.setHeight(CANVAS_SIZE)
  }
}

function parseHexWithOpacity(color: string | undefined, fallback: string) {
  if (!color) {
    return fallback
  }

  if (color.startsWith('rgba') || color.startsWith('rgb') || color.startsWith('transparent')) {
    return color
  }

  return color
}

function isTextbox(object: FabricObject | null): object is Textbox {
  return object instanceof Textbox
}

function isRect(object: FabricObject | null): object is Rect {
  return object instanceof Rect
}

function isEllipse(object: FabricObject | null): object is Ellipse {
  return object instanceof Ellipse
}

function isLine(object: FabricObject | null): object is Line {
  return object instanceof Line
}

const SNAP_THRESHOLD = 8

function clearSmartGuides(canvas: Canvas) {
  const ctx = canvas.getSelectionContext();
  canvas.clearContext(ctx);
}

function drawGuide(canvas: Canvas, type: 'vertical' | 'horizontal', position: number) {
  const ctx = canvas.getSelectionContext();
  ctx.save();
  ctx.strokeStyle = '#462D6E';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  if (type === 'vertical') {
    ctx.moveTo(position, 0);
    ctx.lineTo(position, canvas.height);
  } else {
    ctx.moveTo(0, position);
    ctx.lineTo(canvas.width, position);
  }
  ctx.stroke();
  ctx.restore();
}

function isImage(object: FabricObject | null): object is FabricImage {
  return object instanceof FabricImage
}

function getEditorData(object: FabricObject | null | undefined): EditorObjectData | undefined {
  return (object as FabricObjectWithData | null | undefined)?.data
}

function getFabricObjectId(object: FabricObject | null | undefined) {
  if (!object) {
    return undefined
  }

  const objectId = object.get('id')
  return typeof objectId === 'string' ? objectId : (object as FabricObjectWithData).id
}

function getParsedFabricObjects(json: ParsedFabricJson) {
  if (Array.isArray(json.objects)) {
    return json.objects
  }

  if (Array.isArray(json.canvas?.objects)) {
    return json.canvas.objects
  }

  return []
}

function getScenePoint(event: unknown) {
  if (
    event &&
    typeof event === 'object' &&
    'scenePoint' in event &&
    event.scenePoint &&
    typeof event.scenePoint === 'object' &&
    'x' in event.scenePoint &&
    'y' in event.scenePoint
  ) {
    const scenePoint = event.scenePoint as { x: number; y: number }

    return { x: scenePoint.x, y: scenePoint.y }
  }

  return { x: 120, y: 120 }
}

function createTextbox(options: ConstructorParameters<typeof Textbox>[1]) {
  const textbox = new Textbox('Escribe aquí', {
    fill: '#E0E5EB',
    fontFamily: '"Inter", system-ui, sans-serif',
    fontSize: 48,
    splitByGrapheme: false,
    width: 400,
    ...options,
  })

  applyDefaultObjectControls(textbox)
  return textbox
}

function applyDefaultObjectControls(object: FabricObject) {
  object.set({
    borderColor: '#462D6E',
    borderScaleFactor: 1.5,
    cornerColor: '#E0E5EB',
    cornerSize: 12,
    cornerStrokeColor: '#462D6E',
    cornerStyle: 'circle',
    padding: 6,
    transparentCorners: false,
  })
}

function buildPenPath(points: PenPoint[], currentPoint?: PenPoint) {
  if (points.length === 0) {
    return ''
  }

  let d = `M ${points[0].x} ${points[0].y}`

  for (let index = 1; index < points.length; index += 1) {
    const prev = points[index - 1]
    const curr = points[index]
    const cpx = (prev.x + curr.x) / 2
    const cpy = (prev.y + curr.y) / 2
    d += ` Q ${prev.x} ${prev.y} ${cpx} ${cpy}`
  }

  if (currentPoint) {
    const last = points[points.length - 1]
    d += ` L ${currentPoint.x} ${currentPoint.y}`
    if (points.length === 1) {
      d = `M ${last.x} ${last.y} L ${currentPoint.x} ${currentPoint.y}`
    }
  }

  return d
}

function applyLockedObjectOptions(object: FabricObject) {
  object.set({
    evented: false,
    hasControls: false,
    hoverCursor: 'default',
    lockMovementX: true,
    lockMovementY: true,
    lockRotation: true,
    lockScalingFlip: true,
    selectable: false,
  })
}

function setObjectLockState(object: FabricObject, locked: boolean) {
  object.set({
    evented: true,
    hasControls: !locked,
    hoverCursor: locked ? 'default' : 'move',
    lockMovementX: locked,
    lockMovementY: locked,
    lockRotation: locked,
    lockScalingFlip: locked,
    lockScalingX: locked,
    lockScalingY: locked,
    selectable: true,
  })

  if (!locked) {
    applyDefaultObjectControls(object)
  }

  object.set('isLocked', locked)
}

function createLogoURL() {
  return '/brand/noctra-icon.jpg'
}

async function createLogoObject() {
  const logo = await FabricImage.fromURL(createLogoURL())

  applyDefaultObjectControls(logo)

  const targetSize = 60
  const width = logo.width ?? targetSize
  const height = logo.height ?? targetSize
  const scale = Math.min(targetSize / width, targetSize / height)

  logo.set({
    id: `logo-${createSlideId()}`,
    left: 1080 - 84,
    opacity: 0.6,
    top: 1080 - 84,
  })
  logo.scale(scale)
  return logo
}

async function syncCanvasLogos(canvas: Canvas) {
  const updates = canvas
    .getObjects()
    .filter((object): object is FabricImage => isImage(object) && String(object.get('id')).startsWith('logo-'))
    .map((logo) => logo.setSrc(createLogoURL()))

  await Promise.allSettled(updates)
}

function serializeCanvasState(canvas: Canvas, background: CarouselEditorBackground) {
  const snapshot: SerializedSlideSnapshot = {
    background,
    canvas: canvas.toJSON(),
  }

  return JSON.stringify(snapshot)
}

function parseCanvasState(serialized: string | null) {
  if (!serialized) {
    return null
  }

  try {
    const parsed = JSON.parse(serialized) as SerializedSlideSnapshot

    if (!parsed || typeof parsed !== 'object' || !parsed.canvas || !parsed.background) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function getBackgroundObjects(canvas: Canvas) {
  return canvas
    .getObjects()
    .filter((object) => typeof object.get('id') === 'string' && String(object.get('id')).startsWith('background-'))
}

async function applySlideBackground(canvas: Canvas, background: CarouselEditorBackground) {
  getBackgroundObjects(canvas).forEach((object) => {
    canvas.remove(object)
  })

  const gradientConfig = normalizeGradientConfig(
    background.gradientConfig,
    background.type === 'gradient'
      ? { angle: 145, stops: ['#101417', '#1C2028'], type: 'linear' }
      : undefined
  )
  const fill =
    background.type === 'gradient'
      ? gradientConfig.type === 'radial'
        ? new Gradient({
            colorStops: gradientStopsToColorStops(gradientConfig.stops),
            coords: {
              r1: 0,
              r2: CANVAS_SIZE / 1.3,
              x1: CANVAS_SIZE / 2,
              x2: CANVAS_SIZE / 2,
              y1: CANVAS_SIZE / 2,
              y2: CANVAS_SIZE / 2,
            },
            type: 'radial',
          })
        : new Gradient({
            colorStops: gradientStopsToColorStops(gradientConfig.stops),
            coords: {
              x1: 0,
              x2: CANVAS_SIZE,
              y1: 0,
              y2: Math.tan((gradientConfig.angle * Math.PI) / 180) * CANVAS_SIZE,
            },
            type: 'linear',
          })
      : parseHexWithOpacity(background.solidColor, '#101417')

  const baseRect = new Rect({
    data: { role: 'background' },
    fill,
    height: CANVAS_SIZE,
    id: 'background-base',
    left: 0,
    top: 0,
    width: CANVAS_SIZE,
  })

  applyLockedObjectOptions(baseRect)
  canvas.add(baseRect)
  canvas.sendObjectToBack(baseRect)

  if (background.type === 'image' && background.imageUrl) {
    const image = await FabricImage.fromURL(background.imageUrl, { crossOrigin: 'anonymous' })
    const sourceWidth = image.width ?? CANVAS_SIZE
    const sourceHeight = image.height ?? CANVAS_SIZE
    const scale = Math.max(CANVAS_SIZE / sourceWidth, CANVAS_SIZE / sourceHeight)

    image.set({
      data: { role: 'background' },
      id: 'background-image',
      left: (CANVAS_SIZE - sourceWidth * scale) / 2,
      top: (CANVAS_SIZE - sourceHeight * scale) / 2,
    })
    image.scale(scale)

    if (background.blur && background.blur > 0) {
      image.filters.push(new filters.Blur({ blur: background.blur / 20 }))
      image.applyFilters()
    }

    applyLockedObjectOptions(image)
    canvas.add(image)
    canvas.sendObjectToBack(image)

    const overlay = new Rect({
      data: { role: 'background' },
      fill: `rgba(10,12,15,${background.overlayOpacity ?? 0.55})`,
      height: CANVAS_SIZE,
      id: 'background-overlay',
      left: 0,
      top: 0,
      width: CANVAS_SIZE,
    })
    applyLockedObjectOptions(overlay)
    canvas.add(overlay)
    canvas.sendObjectToBack(overlay)
  }

  canvas.sendObjectToBack(baseRect)
  await syncCanvasLogos(canvas)
}

async function initSlideFromData(args: {
  angle?: string
  background: CarouselEditorBackground
  canvas: Canvas
  slide: InstagramCarouselSlide
  totalSlides: number
}) {
  const { angle, background, canvas, slide } = args

  canvas.clear()
  await applySlideBackground(canvas, background)

  if (slide.type === 'cover') {
    if (angle) {
      const eyebrow = new Textbox(angle.toUpperCase(), {
        fill: '#E0E5EB',
        fontFamily: '"Inter", system-ui, sans-serif',
        fontSize: 34,
        fontWeight: '500',
        id: 'cover-eyebrow',
        left: 80,
        top: 715,
        width: 240,
      })
      const eyebrowBadge = new Rect({
        fill: '#462D6E',
        height: 52,
        id: 'cover-eyebrow-bg',
        left: 64,
        rx: 12,
        ry: 12,
        top: 700,
        width: 270,
      })
      applyDefaultObjectControls(eyebrowBadge)
      applyDefaultObjectControls(eyebrow)
      canvas.add(eyebrowBadge, eyebrow)
    }

    const headline = new Textbox(slide.headline, {
      fill: '#E0E5EB',
      fontFamily: '"Satoshi", "DM Sans", system-ui, sans-serif',
      fontSize: 96,
      fontWeight: '900',
      id: 'headline',
      left: 80,
      lineHeight: 1.15,
      splitByGrapheme: false,
      top: angle ? 780 : 760,
      width: 920,
    })
    const subtitle = new Textbox(slide.body, {
      fill: 'rgba(224,229,235,0.7)',
      fontFamily: '"Inter", system-ui, sans-serif',
      fontSize: 48,
      id: 'body',
      left: 80,
      lineHeight: 1.45,
      top: angle ? 940 : 900,
      width: 760,
    })
    const separator = new Rect({
      fill: '#462D6E',
      height: 6,
      id: 'cover-separator',
      left: 80,
      top: 1020,
      width: 120,
    })
    const handle = new Textbox('@noctra_studio', {
      fill: '#4E576A',
      fontFamily: '"Inter", system-ui, sans-serif',
      fontSize: 30,
      id: 'cover-handle',
      left: 80,
      top: 1036,
      width: 240,
    })
    const logo = await createLogoObject()

    ;[headline, subtitle, separator, handle, logo].forEach((object) => {
      applyDefaultObjectControls(object)
      canvas.add(object)
    })
  }

  if (slide.type === 'content') {
    const headline = new Textbox(slide.headline, {
      fill: '#E0E5EB',
      fontFamily: '"Satoshi", "DM Sans", system-ui, sans-serif',
      fontSize: 88,
      fontWeight: '700',
      id: 'headline',
      left: 80,
      lineHeight: 1.2,
      top: 168,
      width: 920,
    })
    const body = new Textbox(slide.body, {
      fill: 'rgba(224,229,235,0.75)',
      fontFamily: '"Inter", system-ui, sans-serif',
      fontSize: 54,
      id: 'body',
      left: 80,
      lineHeight: 1.6,
      top: 330,
      width: 920,
    })

    applyDefaultObjectControls(headline)
    applyDefaultObjectControls(body)
    canvas.add(headline, body)

    if (slide.stat_or_example) {
      const statRect = new Rect({
        fill: 'rgba(70,45,110,0.12)',
        height: 132,
        id: 'stat-background',
        left: 80,
        rx: 14,
        ry: 14,
        stroke: '#462D6E',
        strokeWidth: 2,
        top: 675,
        width: 920,
      })
      const statText = new Textbox(slide.stat_or_example, {
        fill: '#E0E5EB',
        fontFamily: '"Inter", system-ui, sans-serif',
        fontSize: 38,
        fontWeight: '500',
        id: 'stat-text',
        left: 116,
        lineHeight: 1.45,
        top: 710,
        width: 860,
      })
      applyDefaultObjectControls(statRect)
      applyDefaultObjectControls(statText)
      canvas.add(statRect, statText)
    }

    const logo = await createLogoObject()
    canvas.add(logo)
  }

  if (slide.type === 'cta') {
    const star = new Textbox('✦', {
      fill: '#462D6E',
      fontFamily: '"Inter", system-ui, sans-serif',
      fontSize: 32,
      id: 'cta-star',
      left: 528,
      textAlign: 'center',
      top: 48,
      width: 24,
    })
    const message = new Textbox(slide.headline || slide.body, {
      fill: '#E0E5EB',
      fontFamily: '"Satoshi", "DM Sans", system-ui, sans-serif',
      fontSize: 92,
      fontWeight: '700',
      id: 'headline',
      left: 120,
      lineHeight: 1.28,
      textAlign: 'center',
      top: 360,
      width: 840,
    })
    const divider = new Rect({
      fill: '#462D6E',
      height: 3,
      id: 'cta-divider',
      left: 498,
      top: 608,
      width: 84,
    })
    const handle = new Textbox('@noctra_studio', {
      fill: '#462D6E',
      fontFamily: '"Inter", system-ui, sans-serif',
      fontSize: 44,
      fontWeight: '500',
      id: 'cta-handle',
      left: 350,
      textAlign: 'center',
      top: 650,
      width: 380,
    })
    const footer = new Textbox('Ingeniería de Claridad', {
      fill: '#4E576A',
      fontFamily: '"Inter", system-ui, sans-serif',
      fontSize: 30,
      id: 'cta-footer',
      left: 250,
      textAlign: 'center',
      top: 1026,
      width: 580,
    })
    const logo = await createLogoObject()

    ;[star, message, divider, handle, footer, logo].forEach((object) => {
      applyDefaultObjectControls(object)
      canvas.add(object)
    })
  }

  canvas.renderAll()
}

function SortableSlideThumb({
  isSelected,
  onSelect,
  onSetTab,
  slide,
  totalSlides,
}: {
  isSelected: boolean
  onSelect: () => void
  onSetTab?: (tab: LeftTab) => void
  slide: CarouselEditorSlide
  totalSlides: number
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: slide.id })
  const previewDataUrl = slide.previewDataURL

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="group flex items-start gap-2"
    >
      <button
        type="button"
        data-drag-handle
        className="mt-2 text-[#4E576A] opacity-0 transition-opacity group-hover:opacity-100"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div
        role="button"
        tabIndex={0}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('[data-drag-handle]')) return
          onSelect()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect()
          }
        }}
        className="w-[148px] cursor-pointer text-left"
      >
        <div
          className={cn(
            "relative aspect-square w-full overflow-hidden rounded-xl bg-[#0A0C0F] transition-all group",
            isSelected ? "ring-2 ring-[#462D6E] ring-offset-2 ring-offset-[#10151A]" : "hover:ring-1 hover:ring-white/20"
          )}
        >
          {previewDataUrl ? (
            <Image
              src={previewDataUrl}
              alt={`Slide ${slide.originalData.slide_number}`}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#0F1317]">
              <span className="text-2xl font-bold text-white/10">
                {slide.originalData.slide_number}
              </span>
            </div>
          )}

          {/* Status Indicator */}
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-black/40 px-1.5 py-0.5 text-[9px] font-bold text-white/80 backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100">
            {slide.background.type === 'image' ? (
              <>
                <ImageIcon className="h-2.5 w-2.5" />
                <span>IMG</span>
              </>
            ) : (
              <>
                <Square className="h-2.5 w-2.5" />
                <span>CLR</span>
              </>
            )}
          </div>

          {/* Hover Action */}
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              onSetTab?.('imagen')
            }}
          >
            <span className="text-[10px] font-bold text-white bg-[#462D6E] px-2 py-1 rounded-lg">
              {slide.background.type === 'image' ? 'Cambiar fondo' : 'Poner fondo'}
            </span>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-[#4E576A]">
          <span>{SLIDE_TYPE_LABELS[slide.type]}</span>
          <span>{slide.originalData.slide_number} / {totalSlides}</span>
        </div>
      </div>
    </div>
  )
}

function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
  return (
    <div className="group relative">
      {children}
      <div className="absolute bottom-full left-1/2 mb-2 w-max -translate-x-1/2 rounded bg-[#101417] px-2 py-1 text-[10px] text-[#E0E5EB] opacity-0 shadow-xl border border-white/10 transition-opacity group-hover:opacity-100 pointer-events-none z-50">
        {content}
      </div>
    </div>
  )
}

function NoctraLogoBadge() {
  return (
    <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M19.6 4.4C13.7 4.4 8.9 9.2 8.9 15.1c0 5.9 4.8 10.7 10.7 10.7 2.8 0 5.3-1 7.2-2.8-1.4.5-2.9.7-4.4.7-7 0-12.7-5.7-12.7-12.7 0-2 .5-4 1.4-5.7 1.5-.6 3-.9 4.5-.9 2.1 0 4 .5 5.9 1.4-.6-.9-1.2-1.5-1.9-2.2-.1-.1-.2-.2-.5-.2-.3-.2-.8-.3-1.5-.3Z"
        fill="#E0E5EB"
      />
    </svg>
  )
}

// --- FabricEditor Component ---

export function FabricEditor({
  angle,
  initialActiveSlideIndex,
  initialBackgrounds = [],
  initialEditedSlides = [],
  initialTemplate,
  initialTemplateApplyToAll,
  onClose,
  onSave,
  slides,
  postId,
  userId,
  platform = 'instagram',
  caption,
  hashtags,
  initialActiveFilterId = 'none',
  initialActiveFilterCSS = '',
}: FabricEditorProps) {
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null)
  const canvasRef = useRef<FabricCanvasRef>(null)
  const [leftTab, setLeftTab] = useState<LeftTab>('slides')
  const [rightTab, setRightTab] = useState<RightTab>('properties')
  const [currentThemeId, setCurrentThemeId] = useState<string>('nocturno')
  const [customThemes, setCustomThemes] = useState<CarouselTheme[]>([])
  const [showThemeConfirm, setShowThemeConfirm] = useState(false)
  const [coherenceScore, setCoherenceScore] = useState(100)
  const [activeRightPanel, setActiveRightPanel] = useState<'properties' | 'feed' | 'critique'>('properties')
  const [isUpdatingFeed, setIsUpdatingFeed] = useState(false)
  const [isAnalyzingDesign, setIsAnalyzingDesign] = useState(false)
  const [critiqueResults, setCritiqueResults] = useState<CritiqueResult | null>(null)
  const [critiqueHistory, setCritiqueHistory] = useState<CritiqueResult[]>([])
  const [critiqueCooldown, setCritiqueCooldown] = useState(0)
  const [editingCustomTheme, setEditingCustomTheme] = useState<CarouselTheme>(
    PRESET_THEMES.find((t) => t.id === 'custom')!
  )

  const activeTheme = useMemo(() => {
    if (currentThemeId === 'custom') return editingCustomTheme
    return [...PRESET_THEMES, ...customThemes].find((t) => t.id === currentThemeId) || PRESET_THEMES[0]!
  }, [currentThemeId, customThemes, editingCustomTheme])

  const editorStateRef = useRef<SlideEditorState | null>(null)
  const historiesRef = useRef<Record<string, SlideHistory>>({})
  const loadingRef = useRef(false)
  const dragStateRef = useRef<DragState>(null)
  const selectedObjectRef = useRef<FabricObject | null>(null)
  const [editorState, setEditorState] = useState<SlideEditorState>(() => ({
    activeSlideIndex: initialActiveSlideIndex,
    isDirty: false,
    slides: createEditorSlides(slides, initialBackgrounds, initialEditedSlides),
  }))
  const [activeTool, setActiveTool] = useState<EditorTool>('select')
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null)
  const [textToolbarPos, setTextToolbarPos] = useState({ x: 0, y: 0 })
  const [viewportWidth, setViewportWidth] = useState(
    typeof window === 'undefined' ? 1440 : window.innerWidth
  )
  const [viewportHeight, setViewportHeight] = useState(
    typeof window === 'undefined' ? 900 : window.innerHeight
  )
  const [isDesktopSize, setIsDesktopSize] = useState(
    typeof window === 'undefined' ? true : window.innerWidth >= 1280
  )
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isSavingAll, setIsSavingAll] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewDataURL, setPreviewDataURL] = useState<string>('')
  const [isPreviewExporting, setIsPreviewExporting] = useState(false)
  const [isDialogExporting, setIsDialogExporting] = useState(false)
  const [, setExportStats] = useState<{ count: number; lastExport: string | null }>({ count: 0, lastExport: null })
  const [activeFilterId, setActiveFilterId] = useState(initialActiveFilterId)
  const [activeFilterCSS, setActiveFilterCSS] = useState(initialActiveFilterCSS)
  const [canvasPreviewDataURL, setCanvasPreviewDataURL] = useState<string | null>(null)
  const previewTimeoutRef = useRef<number | null>(null)

  // Illustrator-style workspace states
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const workAreaRef = useRef<HTMLDivElement>(null)
  const [spaceHeld, setSpaceHeld] = useState(false)
  const [canvasScale, setCanvasScale] = useState(getScaleForCanvas(viewportWidth, viewportHeight))
  const [workAreaSize, setWorkAreaSize] = useState({ width: 0, height: 0 })
  const canvasOffsetRef = useRef(canvasOffset)
  const isPanningRef = useRef(isPanning)
  const handleAddTextRef = useRef<((options?: Partial<ConstructorParameters<typeof Textbox>[1]>) => void) | null>(null)

  const handleExportSuccess = useCallback(async (pId: string, platform: string, format: string) => {
    try {
      await fetch('/api/editor/export-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: pId, platform, format }),
      })
      const res = await fetch(`/api/editor/export-log?postId=${pId}`)
      const data = await res.json()
      setExportStats(data)
    } catch (error) {
      console.error('Error logging export:', error)
    }
  }, [])

  useEffect(() => {
    if (postId) {
      fetch(`/api/editor/export-log?postId=${postId}`)
        .then(res => res.json())
        .then(data => setExportStats(data))
        .catch(console.error)
    }
  }, [postId])
  const [savedGradients, setSavedGradients] = useState<CarouselGradientConfig[]>([])
  const [recentFontIds, setRecentFontIds] = useState<string[]>([])
  const [layerVersion, setLayerVersion] = useState(0)
  const [gradientDraft, setGradientDraft] = useState<CarouselGradientConfig>(
    normalizeGradientConfig(BRAND_GRADIENT_SUGGESTIONS[0]?.config)
  )
  const [gridEnabled, setGridEnabled] = useState(false)
  const [gridSize] = useState(16)
  const [rulerEnabled, setRulerEnabled] = useState(false)
  const [smartGuidesEnabled] = useState(true)
  const [isVersionPanelOpen, setIsVersionPanelOpen] = useState(false)
  const penPointsRef = useRef<PenPoint[]>([])
  const penPreviewRef = useRef<Path | null>(null)
  const [penColor, setPenColor] = useState('#E0E5EB')
  const [penWidth, setPenWidth] = useState(2)
  const activeToolRef = useRef(activeTool)
  const gridEnabledRef = useRef(gridEnabled)
  const gridSizeRef = useRef(gridSize)
  const smartGuidesEnabledRef = useRef(smartGuidesEnabled)
  const spaceHeldRef = useRef(spaceHeld)
  const penColorRef = useRef(penColor)
  const penWidthRef = useRef(penWidth)
  const penColorInputRef = useRef<HTMLInputElement | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))
  const activeSlide = editorState.slides[editorState.activeSlideIndex]
  const activeBackground = activeSlide?.background
  const currentSlideImage = activeSlide?.previewDataURL ?? null
  const history = activeSlide ? historiesRef.current[activeSlide.id] : undefined
  const canUndo = Boolean(history && history.cursor > 0)
  const canRedo = Boolean(history && history.cursor < history.states.length - 1)
  const previewFormat = platform === 'instagram' ? 'carousel_slide' : 'single_image'
  const exportFormatKey = previewFormat
  const isActiveObjectLocked = Boolean(selectedObject?.get('isLocked'))
  const previewCaption = [caption, hashtags?.map((tag) => (tag.startsWith('#') ? tag : `#${tag}`)).join(' ')]
    .filter((value): value is string => Boolean(value && value.trim().length > 0))
    .join('\n\n')
  const canvasDisplaySize = CANVAS_SIZE * canvasScale
  const mainWidth = workAreaSize.width || viewportWidth
  const mainHeight = workAreaSize.height || viewportHeight
  const canvasLeft = (mainWidth - canvasDisplaySize) / 2 + canvasOffset.x
  const canvasTop = (mainHeight - canvasDisplaySize) / 2 + canvasOffset.y

  editorStateRef.current = editorState
  activeToolRef.current = activeTool
  gridEnabledRef.current = gridEnabled
  gridSizeRef.current = gridSize
  smartGuidesEnabledRef.current = smartGuidesEnabled
  spaceHeldRef.current = spaceHeld
  penColorRef.current = penColor
  penWidthRef.current = penWidth

  useEffect(() => {
    setSavedGradients(getSavedGradients())
    setRecentFontIds(getRecentFonts())
  }, [])

  useEffect(() => {
    if (activeBackground?.type === 'gradient' && activeBackground.gradientConfig) {
      setGradientDraft(normalizeGradientConfig(activeBackground.gradientConfig))
      return
    }

    setGradientDraft(normalizeGradientConfig(BRAND_GRADIENT_SUGGESTIONS[0]?.config))
  }, [activeBackground?.gradientConfig, activeBackground?.type, activeSlide?.id])

  useEffect(() => {
    canvasOffsetRef.current = canvasOffset
  }, [canvasOffset])

  useEffect(() => {
    isPanningRef.current = isPanning
  }, [isPanning])

  const setDirty = useCallback((value: boolean) => {
    setEditorState((current) => ({ ...current, isDirty: value }))
  }, [])

  const generatePreview = useCallback(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const url = canvas.toDataURL({
      format: 'jpeg',
      quality: 0.5,
      multiplier: 0.4,
    })

    setCanvasPreviewDataURL(url)
  }, [])

  const openPreview = useCallback(async () => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const url = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1,
    })

    setPreviewDataURL(url)
    setIsPreviewOpen(true)
  }, [])

  const handlePreviewExport = useCallback(async () => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    setIsPreviewExporting(true)

    try {
      await exportCanvasUHD(canvas, {
        ...UHD_PRESET,
        activeFilterCSS,
        filename: `noctra-${platform}-${previewFormat}`,
      })

      if (postId) {
        await handleExportSuccess(postId, platform, 'png')
      }
    } finally {
      setIsPreviewExporting(false)
    }
  }, [activeFilterCSS, handleExportSuccess, platform, postId, previewFormat])

  const schedulePreviewRefresh = useCallback(
    (delay = 800) => {
      if (typeof window === 'undefined') {
        return
      }

      if (previewTimeoutRef.current !== null) {
        window.clearTimeout(previewTimeoutRef.current)
      }

      previewTimeoutRef.current = window.setTimeout(() => {
        if (!loadingRef.current) {
          generatePreview()
        }

        previewTimeoutRef.current = null
      }, delay)
    },
    [generatePreview]
  )

  const updateSelectedObject = useCallback(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      selectedObjectRef.current = null
      setSelectedObject(null)
      return
    }

    const nextSelected = canvas.getActiveObject() ?? null
    selectedObjectRef.current = nextSelected
    setSelectedObject(nextSelected)
  }, [])

  const updateTextToolbarPosition = useCallback((obj: FabricObject | null) => {
    if (!(obj instanceof Textbox)) {
      return
    }

    const canvas = canvasRef.current
    const canvasEl = canvasElementRef.current

    if (!canvas || !canvasEl) {
      return
    }

    obj.setCoords()
    const bound = obj.getBoundingRect()
    const rect = canvasEl.getBoundingClientRect()
    const scaleRatio = rect.width / CANVAS_SIZE

    setTextToolbarPos({
      x: rect.left + bound.left * scaleRatio,
      y: rect.top + bound.top * scaleRatio,
    })
  }, [])

  const clearPenDrawing = useCallback(() => {
    const canvas = canvasRef.current

    if (canvas && penPreviewRef.current) {
      canvas.remove(penPreviewRef.current)
    }

    penPreviewRef.current = null
    penPointsRef.current = []
  }, [])

  const setCanvasToolMode = useCallback((tool: EditorTool) => {
    const canvas = canvasRef.current

    if (activeToolRef.current === 'pen' && tool !== 'pen') {
      clearPenDrawing()
    }

    setActiveTool(tool)

    if (!canvas) {
      return
    }

    canvas.selection = tool === 'select'
    canvas.defaultCursor = tool === 'select' ? (spaceHeldRef.current ? 'grab' : 'default') : 'crosshair'
    canvas.hoverCursor = tool === 'select' ? 'move' : 'crosshair'
    canvas.getObjects().forEach((object) => {
      if (object.get('isLocked')) {
        return
      }

      object.set({
        evented: tool === 'select',
        selectable: tool === 'select',
      })
    })
    canvas.requestRenderAll()
  }, [clearPenDrawing])

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    if (spaceHeld) {
      canvas.selection = false
      canvas.forEachObject((object) => {
        object.set({
          evented: false,
          selectable: false,
        })
      })
      canvas.defaultCursor = 'grab'
      canvas.hoverCursor = 'grab'
    } else {
      const isSelectMode = activeToolRef.current === 'select'
      canvas.selection = isSelectMode
      canvas.forEachObject((object) => {
        const isLocked = Boolean(getEditorData(object)?.isLocked || object.get('isLocked'))

        object.set({
          evented: isSelectMode && !isLocked,
          selectable: isSelectMode && !isLocked,
        })
      })
      canvas.defaultCursor = isSelectMode ? 'default' : 'crosshair'
      canvas.hoverCursor = isSelectMode ? 'move' : 'crosshair'
    }

    canvas.renderAll()
  }, [spaceHeld])

  const updateSlideAtIndex = useCallback((index: number, updater: (slide: CarouselEditorSlide) => CarouselEditorSlide) => {
    setEditorState((current) => ({
      ...current,
      slides: current.slides.map((slide, slideIndex) => (slideIndex === index ? updater(slide) : slide)),
    }))
  }, [])

  const persistCurrentCanvas = useCallback(
    (options?: { markDirty?: boolean; refreshPreview?: boolean }) => {
      const canvas = canvasRef.current

      if (!canvas || !editorStateRef.current) {
        return null
      }

      const currentIndex = editorStateRef.current.activeSlideIndex
      const currentSlide = editorStateRef.current.slides[currentIndex]

      if (!currentSlide) {
        return null
      }

      const serialized = serializeCanvasState(canvas, currentSlide.background)
      const previewDataURL = canvas.toDataURL({
        format: 'png',
        multiplier: 1,
      })

      const nextSlide = {
        ...currentSlide,
        fabricJSON: serialized,
        previewDataURL: options?.refreshPreview === false ? currentSlide.previewDataURL : previewDataURL,
      }

      setEditorState((current) => ({
        ...current,
        isDirty: options?.markDirty ?? current.isDirty,
        slides: current.slides.map((slide, index) => (index === currentIndex ? nextSlide : slide)),
      }))

      return nextSlide
    },
    []
  )

  const pushHistoryState = useCallback((slideId: string, serialized: string) => {
    const previous = historiesRef.current[slideId] ?? { cursor: -1, states: [] }
    const trimmed = previous.states.slice(0, previous.cursor + 1)

    if (trimmed[trimmed.length - 1] === serialized) {
      return
    }

    const nextStates = [...trimmed, serialized].slice(-50)
    historiesRef.current[slideId] = {
      cursor: nextStates.length - 1,
      states: nextStates,
    }
  }, [])

  const commitCanvasMutation = useCallback(() => {
    if (loadingRef.current || !editorStateRef.current) {
      return
    }

    setIsUpdatingFeed(true)
    const savedSlide = persistCurrentCanvas({ markDirty: true, refreshPreview: true })

    if (!savedSlide) {
      return
    }

    pushHistoryState(savedSlide.id, savedSlide.fabricJSON ?? '')
    setLayerVersion((version) => version + 1)
  }, [persistCurrentCanvas, pushHistoryState])

  const handleDeleteSelection = useCallback(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const objects = canvas
      .getActiveObjects()
      .filter((object) => !Boolean(object.get('isLocked')))

    if (objects.length === 0) {
      return
    }

    objects.forEach((object) => canvas.remove(object))
    canvas.discardActiveObject()
    canvas.requestRenderAll()
    commitCanvasMutation()
    updateSelectedObject()
  }, [commitCanvasMutation, updateSelectedObject])

  const handleDuplicateSelection = useCallback(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const active = canvas.getActiveObject()
    if (!active || Boolean(active.get('isLocked'))) {
      return
    }

    active.clone().then((cloned: FabricObject) => {
      canvas.discardActiveObject()

      cloned.set({
        left: (cloned.left ?? 0) + 20,
        top: (cloned.top ?? 0) + 20,
      })

      if (cloned instanceof ActiveSelection) {
        cloned.canvas = canvas
        cloned.forEachObject((object: FabricObject) => {
          applyDefaultObjectControls(object)
          canvas.add(object)
        })
        cloned.setCoords()
      } else {
        applyDefaultObjectControls(cloned)
        canvas.add(cloned)
      }

      canvas.setActiveObject(cloned)
      canvas.requestRenderAll()
      commitCanvasMutation()
      updateSelectedObject()
    })
  }, [commitCanvasMutation, updateSelectedObject])

  const handleDialogExport = useCallback(async (options: ExportOptions) => {
    const current = editorStateRef.current
    if (!current) return
    
    setIsDialogExporting(true)

    try {
      // 1. Persist current slide state first
      persistCurrentCanvas({ markDirty: false, refreshPreview: false })
      // Use latest slides from the ref (updated by persistCurrentCanvas)
      const slides = editorStateRef.current?.slides ?? current.slides
      const netId = platform ?? 'social-post'

      // 2. Render all slides offscreen
      const offscreen = new StaticCanvas(undefined, { 
        width: 1080, 
        height: 1080,
        enableRetinaScaling: false 
      })
      
      const dataURLs: string[] = []

      for (const slide of slides) {
        if (!slide.fabricJSON) continue
        
        offscreen.clear()
        await offscreen.loadFromJSON(slide.fabricJSON)
        
        const url = offscreen.toDataURL({
          format: options.format,
          quality: options.quality,
          multiplier: options.multiplier
        })
        
        dataURLs.push(url)
      }

      // 3. Generate ZIP with images and copy
      await exportMultiPlatformZip(dataURLs, slides, netId)

      if (postId) {
        await handleExportSuccess(postId, platform ?? 'bundle', options.format)
      }

      setIsExportDialogOpen(false)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsDialogExporting(false)
    }
  }, [persistCurrentCanvas, handleExportSuccess, platform, postId])

  const handleBringForwardSelection = useCallback(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const objects = canvas
      .getActiveObjects()
      .filter((object) => !Boolean(object.get('isLocked')))

    if (objects.length === 0) {
      return
    }

    objects.forEach((object) => {
      canvas.bringObjectForward(object)
    })

    canvas.requestRenderAll()
    commitCanvasMutation()
    updateSelectedObject()
  }, [commitCanvasMutation, updateSelectedObject])

  const handleSendBackwardSelection = useCallback(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const objects = canvas
      .getActiveObjects()
      .filter((object) => !Boolean(object.get('isLocked')))

    if (objects.length === 0) {
      return
    }

    objects.forEach((object) => {
      canvas.sendObjectBackwards(object)
    })

    canvas.requestRenderAll()
    commitCanvasMutation()
    updateSelectedObject()
  }, [commitCanvasMutation, updateSelectedObject])

  const handleToggleLockSelection = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const objects = canvas.getActiveObjects()
    if (objects.length === 0) return

    const nextLocked = !objects.every((object) => Boolean(object.get('isLocked')))
    objects.forEach((object) => setObjectLockState(object, nextLocked))
    canvas.requestRenderAll()
    commitCanvasMutation()
    updateSelectedObject()
  }, [commitCanvasMutation, updateSelectedObject])

  const handleVerticalAlign = useCallback((align: 'top' | 'middle' | 'bottom') => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const active = canvas.getActiveObject()
    if (!active || Boolean(active.get('isLocked'))) return

    const margin = 80 // Safe margin for slides
    const h = active.height! * active.scaleY!
    
    let newTop = active.top!

    if (align === 'top') {
      newTop = margin
    } else if (align === 'middle') {
      newTop = (CANVAS_SIZE - h) / 2
    } else if (align === 'bottom') {
      newTop = CANVAS_SIZE - h - margin
    }

    active.set({ top: newTop })
    active.setCoords()
    canvas.requestRenderAll()
    commitCanvasMutation()
  }, [commitCanvasMutation])

  // --- Advanced Text Effects Helpers ---

  const syncLinkedBackground = useCallback((textObj: Textbox) => {
    const canvas = canvasRef.current
    const backgroundHighlight = getEditorData(textObj)?.backgroundHighlight
    if (!canvas || !backgroundHighlight?.enabled) return

    const rectId = backgroundHighlight.rectId
    const bgRect = canvas.getObjects().find((object): object is Rect => isRect(object) && getFabricObjectId(object) === rectId)

    if (!bgRect) return

    const padding = backgroundHighlight.padding || 0
    const bounds = textObj.getBoundingRect()
    
    bgRect.set({
      left: bounds.left - padding,
      top: bounds.top - padding,
      width: bounds.width + (padding * 2),
      height: bounds.height + (padding * 2),
      angle: textObj.angle,
      scaleX: 1,
      scaleY: 1,
    })
    
    // Position correctly if text is rotated
    canvas.requestRenderAll()
  }, [])

  useEffect(() => {
    if (critiqueCooldown <= 0) return
    const timer = setInterval(() => setCritiqueCooldown(prev => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [critiqueCooldown])

  const handleAnalyzeDesign = useCallback(async () => {
    if (isAnalyzingDesign || critiqueCooldown > 0 || !canvasRef.current) return
    
    setIsAnalyzingDesign(true)
    setActiveRightPanel('critique')
    
    try {
      const canvas = canvasRef.current
      const imageData = canvas.toDataURL({ 
        format: 'png', 
        multiplier: 1, 
        quality: 0.8 
      }).split(',')[1]

      const currentSlide = editorState.slides[editorState.activeSlideIndex]
      const slideType = currentSlide.originalData?.type || 'content'
      
      const response = await fetch('/api/editor/critique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageData,
          slideType,
          platform: 'instagram',
          angle: angle || 'general'
        })
      })

      if (!response.ok) throw new Error('API request failed')
      
      const results = await response.json()
      const newResult = {
        ...results,
        timestamp: Date.now(),
        thumbnail: `data:image/png;base64,${imageData}`
      }
      
      setCritiqueResults(newResult)
      setCritiqueHistory(prev => [newResult, ...prev.slice(0, 4)])
      setCritiqueCooldown(10) // 10s cooldown
    } catch (error) {
      console.error('Critique Error:', error)
      alert("Error al analizar el diseño. Inténtalo de nuevo.")
    } finally {
      setIsAnalyzingDesign(false)
    }
  }, [isAnalyzingDesign, critiqueCooldown, angle, editorState.slides, editorState.activeSlideIndex])

  const handleApplyCritiqueFix = useCallback((fixText: string, element: string) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const normalizedElement = (element || '').toLowerCase()
    const normalizedFix = fixText.toLowerCase()
    
    // Heuristic: Find target object
    const objects = canvas.getObjects()
    let target = canvas.getActiveObject()

    if (!target) {
      if (normalizedElement.includes('headline') || normalizedElement.includes('título')) {
        target = objects.find((object) => {
          const candidate = object as FabricObjectWithData
          return (candidate.fontSize ?? 0) > 40 || (candidate.text?.length ?? 0) < 50
        })
      } else if (normalizedElement.includes('body') || normalizedElement.includes('cuerpo')) {
        target = objects.find((object) => {
          const candidate = object as FabricObjectWithData
          return (candidate.fontSize ?? 0) < 40 && (candidate.text?.length ?? 0) > 10
        })
      }
    }

    if (!target) return

      try {
        if (normalizedFix.includes('aumenta') || normalizedFix.includes('más grande')) {
          const current = (target as FabricObjectWithData).fontSize || 40
          target.set('fontSize', current + 15)
        } else if (normalizedFix.includes('reduce') || normalizedFix.includes('más pequeño')) {
          const current = (target as FabricObjectWithData).fontSize || 40
          target.set('fontSize', Math.max(12, current - 8))
      } else if (normalizedFix.includes('contraste') || normalizedFix.includes('color')) {
        target.set('fill', '#E0E5EB')
      } else if (normalizedFix.includes('centra') || normalizedFix.includes('alineación')) {
        canvas.centerObjectH(target)
      }

      canvas.renderAll()
      commitCanvasMutation()
    } catch (e) {
      console.error('Error applying heuristic fix:', e)
    }
  }, [commitCanvasMutation])

  const loadSlideToCanvas = useCallback(
    async (slide: CarouselEditorSlide, totalSlides: number) => {
      const canvas = canvasRef.current

      if (!canvas) {
        return
      }

      loadingRef.current = true
      canvas.discardActiveObject()
      setSelectedObject(null)

      const parsed = parseCanvasState(slide.fabricJSON)
      const parsedObjects = Array.isArray(parsed?.canvas?.objects) ? parsed.canvas.objects : []
      const hasObjects = parsedObjects.length > 0

      if (parsed && hasObjects) {
        await canvas.loadFromJSON(parsed.canvas)
        await syncCanvasLogos(canvas)
      } else {
        const availableTemplates = Object.values(templates)
        const defaultTemplate =
          availableTemplates.find((template) => template.id === 'editorial') ?? availableTemplates[0]

        if (defaultTemplate) {
          ensureCanvasHasDesignSize(canvas)
          initSlideFromTemplate(canvas, defaultTemplate, slide.originalData, slide.originalData.slide_number)
        } else {
          await initSlideFromData({
            angle,
            background: slide.background,
            canvas,
            slide: slide.originalData,
            totalSlides,
          })
        }
      }

      canvas.renderAll()
      canvas.getObjects().forEach((object) => {
        applyDefaultObjectControls(object)
      })
      loadingRef.current = false
      updateSelectedObject()
      setCanvasToolMode('select')
      generatePreview()
    },
    [angle, generatePreview, setCanvasToolMode, updateSelectedObject]
  )

  const handleRestoreVersion = useCallback(async (restoredSlides: CarouselEditorSlide[]) => {
    // 1. Update the local slides state
    const newState = {
      ...editorState,
      slides: restoredSlides,
      activeSlideIndex: 0,
      isDirty: false
    }
    
    setEditorState(newState)
    editorStateRef.current = newState

    // 2. Clear all history for all restored slides
    restoredSlides.forEach(s => {
      historiesRef.current[s.id] = { cursor: 0, states: s.fabricJSON ? [s.fabricJSON] : [] }
    })

    // 3. Load the first slide into canvas
    await loadSlideToCanvas(restoredSlides[0], restoredSlides.length)
    setIsVersionPanelOpen(false)
  }, [editorState, loadSlideToCanvas])

  const handleAutoSaveVersion = useCallback(async (nameSuffix: string) => {
    try {
      await saveDesignVersion({
        userId,
        postId: postId || null,
        name: `Auto: ${nameSuffix} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
        slides: editorState.slides,
        metadata: {
          angle: angle || '',
          platform: platform || 'instagram',
          postId: postId || null,
          templateIds: [],
          theme: currentThemeId
        }
      })
    } catch (err) {
      console.error('[AutoSave] Failed:', err)
    }
  }, [userId, postId, editorState.slides, angle, platform, currentThemeId])

  const bootstrapSlides = useCallback(async () => {
    const canvas = canvasRef.current

    if (!canvas || !editorStateRef.current) {
      return
    }

    loadingRef.current = true
    const seededSlides: CarouselEditorSlide[] = []

    for (let i = 0; i < editorStateRef.current.slides.length; i++) {
      const slide = editorStateRef.current.slides[i]

      // Apply initial template if provided
      if (initialTemplate && (i === initialActiveSlideIndex || initialTemplateApplyToAll)) {
        ensureCanvasHasDesignSize(canvas)
        initSlideFromTemplate(canvas, initialTemplate, slide.originalData, i + 1)
        const serialized = serializeCanvasState(canvas, slide.background)
        const previewDataURL = canvas.toDataURL({ format: 'png', multiplier: 1 })

        historiesRef.current[slide.id] = {
          cursor: 0,
          states: [serialized],
        }

        seededSlides.push({
          ...slide,
          fabricJSON: serialized,
          previewDataURL,
        })
        continue
      }

      if (slide.fabricJSON && slide.previewDataURL) {
        seededSlides.push(slide)
        historiesRef.current[slide.id] = {
          cursor: 0,
          states: [slide.fabricJSON],
        }
        continue
      }

      await loadSlideToCanvas(slide, editorStateRef.current.slides.length)
      const serialized = serializeCanvasState(canvas, slide.background)
      const previewDataURL = canvas.toDataURL({ format: 'png', multiplier: 1 })

      historiesRef.current[slide.id] = {
        cursor: 0,
        states: [serialized],
      }

      seededSlides.push({
        ...slide,
        fabricJSON: serialized,
        previewDataURL,
      })
    }

    setEditorState((current) => ({
      ...current,
      slides: seededSlides,
    }))

    const nextActive = seededSlides[Math.min(initialActiveSlideIndex, seededSlides.length - 1)] ?? seededSlides[0]

    if (nextActive) {
      await loadSlideToCanvas(nextActive, seededSlides.length)
    }

    loadingRef.current = false
    setIsBootstrapping(false)
  }, [initialActiveSlideIndex, initialTemplate, initialTemplateApplyToAll, loadSlideToCanvas])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      if (previewTimeoutRef.current !== null) {
        window.clearTimeout(previewTimeoutRef.current)
      }
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth)
      setViewportHeight(window.innerHeight)
      setIsDesktopSize(window.innerWidth >= 1280)
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const workArea = workAreaRef.current

    if (!workArea) {
      return
    }

    const updateWorkAreaSize = () => {
      setWorkAreaSize({
        width: workArea.clientWidth,
        height: workArea.clientHeight,
      })
    }

    updateWorkAreaSize()

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]

      if (!entry) {
        return
      }

      setWorkAreaSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })

    resizeObserver.observe(workArea)

    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    let mounted = true
    const handleCanvasMutation = (event?: { target?: FabricObject | null }) => {
      if (loadingRef.current) {
        return
      }

      const target = event?.target
      if (target === penPreviewRef.current || target?.get('id') === PEN_PREVIEW_ID) {
        return
      }

      canvasRef.current?.requestRenderAll()
      commitCanvasMutation()
      schedulePreviewRefresh()
    }

    async function setupCanvas() {
      await document.fonts.ready

      if (!mounted || !canvasElementRef.current) {
        return
      }

      const canvas = new Canvas(canvasElementRef.current, {
        height: CANVAS_SIZE,
        controlsAboveOverlay: true,
        fireRightClick: true,
        perPixelTargetFind: false,
        preserveObjectStacking: true,
        renderOnAddRemove: false,
        selection: true,
        selectionBorderColor: '#462D6E',
        selectionColor: 'rgba(70, 45, 110, 0.15)',
        selectionDashArray: [4, 4],
        selectionLineWidth: 1,
        skipTargetFind: false,
        stopContextMenu: true,
        targetFindTolerance: 8,
        width: CANVAS_SIZE,
      })
      canvasRef.current = canvas

      canvas.on('selection:created', (e) => {
        if (e.selected?.[0]) {
          updateTextToolbarPosition(e.selected[0])
        }
        updateSelectedObject()
      })
      canvas.on('selection:updated', (e) => {
        if (e.selected?.[0]) {
          updateTextToolbarPosition(e.selected[0])
        }
        updateSelectedObject()
      })
      canvas.on('selection:cleared', updateSelectedObject)
      canvas.on('object:added', handleCanvasMutation)
      canvas.on('object:removed', handleCanvasMutation)
      canvas.on('object:modified', handleCanvasMutation)
      canvas.on('text:changed', handleCanvasMutation)

      // Handle editing for curved text
      canvas.on('text:edit-curved' as never, (event: { target?: FabricObject }) => {
        const group = event.target instanceof Group ? (event.target as Group & FabricObjectWithData) : null
        const originalData = group ? getEditorData(group)?.originalTextbox : null
        if (!group || getEditorData(group)?.type !== 'arc-text' || !originalData) return

        // Restore textbox
        const originalTextbox = originalData as unknown as Partial<ConstructorParameters<typeof Textbox>[1]> & {
          text?: string
        }
        const textbox = new Textbox(originalTextbox.text ?? '', {
          ...originalTextbox,
          left: group.left,
          top: group.top,
          angle: group.angle,
          scaleX: group.scaleX,
          scaleY: group.scaleY,
        })

        canvas.remove(group)
        canvas.add(textbox)
        canvas.setActiveObject(textbox)
        textbox.enterEditing()
        canvas.requestRenderAll()
      })

      const updatePenPreview = (currentPoint?: PenPoint) => {
        const preview = penPreviewRef.current
        const d = buildPenPath(penPointsRef.current, currentPoint)

        if (!preview || !d) {
          return
        }

        const previewWithInternals = preview as PathWithInternals

        if (typeof previewWithInternals._setPath === 'function') {
          previewWithInternals._setPath(d, true)
        } else {
          preview.set({ path: d as unknown as Path['path'] })
          previewWithInternals.setDimensions?.()
        }

        preview.setCoords()
      }

      canvas.on('mouse:dblclick', (event) => {
        if (activeToolRef.current === 'pen') {
          if (penPointsRef.current.length < 2) {
            clearPenDrawing()
            canvas.requestRenderAll()
            return
          }

          if (penPreviewRef.current) {
            canvas.remove(penPreviewRef.current)
          }

          const finalPath = new Path(buildPenPath(penPointsRef.current), {
            evented: true,
            fill: 'transparent',
            id: `path-${createSlideId()}`,
            selectable: true,
            stroke: penColorRef.current,
            strokeLineCap: 'round',
            strokeLineJoin: 'round',
            strokeWidth: penWidthRef.current,
          })
          applyDefaultObjectControls(finalPath)
          canvas.add(finalPath)
          canvas.setActiveObject(finalPath)

          penPreviewRef.current = null
          penPointsRef.current = []
          setCanvasToolMode('select')
          commitCanvasMutation()
          canvas.renderAll()
          return
        }

        const target = event.target

        if (!(target instanceof Textbox)) {
          return
        }

        canvas.setActiveObject(target)
        target.enterEditing()
        target.selectAll()
        canvas.renderAll()
      })

      canvas.on('mouse:over', (event) => {
        if (event.target) {
          canvas.defaultCursor = event.target instanceof Textbox ? 'text' : 'move'
          return
        }

        canvas.defaultCursor = spaceHeldRef.current ? 'grab' : 'default'
      })

      canvas.on('mouse:out', () => {
        canvas.defaultCursor = spaceHeldRef.current ? 'grab' : 'default'
      })

      canvas.on('object:moving', (e) => {
        const obj = e.target
        if (!obj) return

        updateTextToolbarPosition(obj)

        let snappedX = obj.left
        let snappedY = obj.top

        // Grid Snap
        if (gridEnabledRef.current) {
          snappedX = Math.round(obj.left / gridSizeRef.current) * gridSizeRef.current
          snappedY = Math.round(obj.top / gridSizeRef.current) * gridSizeRef.current
        }

        // Smart Guides & Center Snap
        if (smartGuidesEnabledRef.current) {
          clearSmartGuides(canvas)
          const objRect = obj.getBoundingRect()
          const canvasCenter = CANVAS_SIZE / 2
          
          // Canvas Center H
          if (Math.abs(obj.getCenterPoint().x - canvasCenter) < SNAP_THRESHOLD) {
            snappedX = canvasCenter - (objRect.width / 2)
            drawGuide(canvas, 'vertical', canvasCenter)
          }
          // Canvas Center V
          if (Math.abs(obj.getCenterPoint().y - canvasCenter) < SNAP_THRESHOLD) {
            snappedY = canvasCenter - (objRect.height / 2)
            drawGuide(canvas, 'horizontal', canvasCenter)
          }

          // Object-to-object alignment
          const otherObjects = canvas.getObjects().filter(o => o !== obj && !o.get('isLocked'))
          for (const other of otherObjects) {
            const otherRect = other.getBoundingRect()
            
            // Align Left edges
            if (Math.abs(objRect.left - otherRect.left) < SNAP_THRESHOLD) {
              snappedX = otherRect.left
              drawGuide(canvas, 'vertical', otherRect.left)
            }
            // Align Right edges
            if (Math.abs((objRect.left + objRect.width) - (otherRect.left + otherRect.width)) < SNAP_THRESHOLD) {
              snappedX = otherRect.left + otherRect.width - objRect.width
              drawGuide(canvas, 'vertical', otherRect.left + otherRect.width)
            }
            // Align Top edges
            if (Math.abs(objRect.top - otherRect.top) < SNAP_THRESHOLD) {
              snappedY = otherRect.top
              drawGuide(canvas, 'horizontal', otherRect.top)
            }
            // Align Bottom edges
            if (Math.abs((objRect.top + objRect.height) - (otherRect.top + otherRect.height)) < SNAP_THRESHOLD) {
              snappedY = otherRect.top + otherRect.height - objRect.height
              drawGuide(canvas, 'horizontal', otherRect.top + otherRect.height)
            }
          }
        }

        obj.set({ left: snappedX, top: snappedY })
        canvas.requestRenderAll()
      })

      canvas.on('object:modified', () => {
        clearSmartGuides(canvas)
        canvas.renderAll()
      })
      canvas.on('object:scaling', () => {
        if (smartGuidesEnabledRef.current) {
          // Drawing guides simplified for scaling to avoid jitter
          const obj = canvas.getActiveObject()
          if (obj) {
            const center = obj.getCenterPoint()
            if (Math.abs(center.x - CANVAS_SIZE/2) < 2) drawGuide(canvas, 'vertical', CANVAS_SIZE/2)
            if (Math.abs(center.y - CANVAS_SIZE/2) < 2) drawGuide(canvas, 'horizontal', CANVAS_SIZE/2)
          }
        }
      })

      canvas.on('mouse:down', (event) => {
        if (loadingRef.current) {
          return
        }

        if (spaceHeldRef.current) {
          const pointerEvent = event.e as MouseEvent
          canvas.selection = false
          isPanningRef.current = true
          panStartRef.current = {
            x: pointerEvent.clientX,
            y: pointerEvent.clientY,
            ox: canvasOffsetRef.current.x,
            oy: canvasOffsetRef.current.y,
          }
          setIsPanning(true)
          return
        }

        if (activeToolRef.current === 'text') {
          const point = getScenePoint(event.e)
          const textbox = createTextbox({
            id: `text-${createSlideId()}`,
            left: point.x,
            top: point.y,
          })
          canvas.add(textbox)
          canvas.setActiveObject(textbox)
          textbox.enterEditing()
          setCanvasToolMode('select')
          updateSelectedObject()
          canvas.requestRenderAll()
          return
        }

        if (activeToolRef.current === 'pen') {
          const point = getScenePoint(event.e)
          penPointsRef.current.push(point)

          if (penPointsRef.current.length === 1) {
            const preview = new Path(`M ${point.x} ${point.y}`, {
              evented: false,
              excludeFromExport: true,
              fill: 'transparent',
              id: PEN_PREVIEW_ID,
              selectable: false,
              stroke: penColorRef.current,
              strokeLineCap: 'round',
              strokeLineJoin: 'round',
              strokeWidth: penWidthRef.current,
            })
            penPreviewRef.current = preview
            canvas.add(preview)
          } else {
            updatePenPreview(point)
          }

          canvas.requestRenderAll()
          return
        }

        if (activeToolRef.current === 'rect') {
          const point = getScenePoint(event.e)
          const rect = new Rect({
            fill: '#212631',
            height: 1,
            id: `rect-${createSlideId()}`,
            left: point.x,
            rx: 8,
            ry: 8,
            stroke: '#4E576A',
            strokeWidth: 1,
            top: point.y,
            width: 1,
          })
          applyDefaultObjectControls(rect)
          dragStateRef.current = { originX: point.x, originY: point.y, shape: rect }
          canvas.add(rect)
          canvas.requestRenderAll()
          return
        }

        if (activeToolRef.current === 'circle') {
          const point = getScenePoint(event.e)
          const ellipse = new Ellipse({
            fill: 'transparent',
            id: `ellipse-${createSlideId()}`,
            left: point.x,
            originX: 'left',
            originY: 'top',
            rx: 1,
            ry: 1,
            stroke: '#462D6E',
            strokeWidth: 2,
            top: point.y,
          })
          applyDefaultObjectControls(ellipse)
          dragStateRef.current = { originX: point.x, originY: point.y, shape: ellipse }
          canvas.add(ellipse)
          canvas.requestRenderAll()
          return
        }

        if (activeToolRef.current === 'line') {
          const point = getScenePoint(event.e)
          const line = new Line([point.x, point.y, point.x + 1, point.y + 1], {
            id: `line-${createSlideId()}`,
            stroke: '#4E576A',
            strokeWidth: 2,
          })
          applyDefaultObjectControls(line)
          dragStateRef.current = { originX: point.x, originY: point.y, shape: line }
          canvas.add(line)
          canvas.requestRenderAll()
        }
      })

      canvas.on('mouse:move', (event) => {
        if (spaceHeldRef.current && isPanningRef.current && panStartRef.current) {
          const pointerEvent = event.e as MouseEvent
          const dx = pointerEvent.clientX - panStartRef.current.x
          const dy = pointerEvent.clientY - panStartRef.current.y
          setCanvasOffset({
            x: panStartRef.current.ox + dx,
            y: panStartRef.current.oy + dy,
          })
          return
        }

        if (activeToolRef.current === 'pen' && penPointsRef.current.length > 0) {
          const point = getScenePoint(event.e)
          updatePenPreview(point)
          canvas.requestRenderAll()
          return
        }

        const dragState = dragStateRef.current

        if (!dragState?.shape) {
          return
        }

        const point = getScenePoint(event.e)
        const width = point.x - dragState.originX
        const height = point.y - dragState.originY

        if (isRect(dragState.shape)) {
          dragState.shape.set({
            height: Math.abs(height),
            left: width >= 0 ? dragState.originX : point.x,
            top: height >= 0 ? dragState.originY : point.y,
            width: Math.abs(width),
          })
        }

        if (isEllipse(dragState.shape)) {
          dragState.shape.set({
            left: width >= 0 ? dragState.originX : point.x,
            rx: Math.max(Math.abs(width) / 2, 1),
            ry: Math.max(Math.abs(height) / 2, 1),
            top: height >= 0 ? dragState.originY : point.y,
          })
        }

        if (isLine(dragState.shape)) {
          dragState.shape.set({
            x2: point.x,
            y2: point.y,
          })
        }

        canvas.requestRenderAll()
      })

      canvas.on('mouse:up', () => {
        if (isPanningRef.current) {
          isPanningRef.current = false
          setIsPanning(false)
          panStartRef.current = null
          return
        }

        dragStateRef.current = null

        if (activeToolRef.current !== 'select' && activeToolRef.current !== 'pen') {
          setCanvasToolMode('select')
        }

        canvas.renderAll()
      })

      const initialState = editorStateRef.current
      const initialSlide = initialState?.slides[initialState.activeSlideIndex]

      if (initialSlide) {
        await loadSlideToCanvas(initialSlide, initialState.slides.length)
      }

      await bootstrapSlides()
      generatePreview()
    }

    void setupCanvas()

    return () => {
      mounted = false
      canvasRef.current?.dispose()
      canvasRef.current = null
    }
  }, [
    bootstrapSlides,
    clearPenDrawing,
    commitCanvasMutation,
    generatePreview,
    loadSlideToCanvas,
    schedulePreviewRefresh,
    setCanvasToolMode,
    updateSelectedObject,
    updateTextToolbarPosition,
  ])

  // Synchronize Icons with Theme Accent
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const icons = canvas.getObjects().filter((object) => getEditorData(object)?.role === 'icon')
    let hasChanged = false;

    icons.forEach(icon => {
      const currentFill = icon.get('fill');
      if (currentFill !== activeTheme.accent) {
        icon.set('fill', activeTheme.accent);
        hasChanged = true;
      }
    });

    if (hasChanged) {
      canvas.renderAll();
      commitCanvasMutation();
    }
  }, [activeTheme.accent, commitCanvasMutation]);

  const handleFilterChange = useCallback((filterId: string, filterCSS: string) => {
    setActiveFilterId(filterId)
    setActiveFilterCSS(filterCSS)
  }, [])

  const switchToSlide = useCallback(
    async (nextIndex: number) => {
      const nextSlide = editorStateRef.current?.slides[nextIndex]

      if (!nextSlide) {
        return
      }

      persistCurrentCanvas({ markDirty: editorStateRef.current?.isDirty ?? false, refreshPreview: true })
      setEditorState((current) => ({ ...current, activeSlideIndex: nextIndex }))
      await loadSlideToCanvas(nextSlide, editorStateRef.current?.slides.length ?? slides.length)
    },
    [loadSlideToCanvas, persistCurrentCanvas, slides.length]
  )

  const applyBackgroundUpdate = useCallback(
    async (updater: (background: CarouselEditorBackground) => CarouselEditorBackground) => {
      const canvas = canvasRef.current
      const current = editorStateRef.current

      if (!canvas || !current) {
        return
      }

      const currentSlide = current.slides[current.activeSlideIndex]
      const nextBackground = updater(currentSlide.background)

      updateSlideAtIndex(current.activeSlideIndex, (slide) => ({
        ...slide,
        background: nextBackground,
      }))

      await applySlideBackground(canvas, nextBackground)
      await syncCanvasLogos(canvas)
      canvas.requestRenderAll()
      commitCanvasMutation()
    },
    [commitCanvasMutation, updateSlideAtIndex]
  )

  const handleUndo = useCallback(async () => {
    const current = editorStateRef.current
    const currentSlide = current?.slides[current.activeSlideIndex]

    if (!current || !currentSlide) {
      return
    }

    const slideHistory = historiesRef.current[currentSlide.id]

    if (!slideHistory || slideHistory.cursor <= 0) {
      return
    }

    const nextCursor = slideHistory.cursor - 1
    historiesRef.current[currentSlide.id] = {
      ...slideHistory,
      cursor: nextCursor,
    }

    const serialized = slideHistory.states[nextCursor]
    updateSlideAtIndex(current.activeSlideIndex, (slide) => ({
      ...slide,
      fabricJSON: serialized,
    }))
    await loadSlideToCanvas({ ...currentSlide, fabricJSON: serialized }, current.slides.length)
    setDirty(true)
  }, [loadSlideToCanvas, setDirty, updateSlideAtIndex])

  const handleRedo = useCallback(async () => {
    const current = editorStateRef.current
    const currentSlide = current?.slides[current.activeSlideIndex]

    if (!current || !currentSlide) {
      return
    }

    const slideHistory = historiesRef.current[currentSlide.id]

    if (!slideHistory || slideHistory.cursor >= slideHistory.states.length - 1) {
      return
    }

    const nextCursor = slideHistory.cursor + 1
    historiesRef.current[currentSlide.id] = {
      ...slideHistory,
      cursor: nextCursor,
    }

    const serialized = slideHistory.states[nextCursor]
    updateSlideAtIndex(current.activeSlideIndex, (slide) => ({
      ...slide,
      fabricJSON: serialized,
    }))
    await loadSlideToCanvas({ ...currentSlide, fabricJSON: serialized }, current.slides.length)
    setDirty(true)
  }, [loadSlideToCanvas, setDirty, updateSlideAtIndex])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isInputTarget = Boolean(
        target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.getAttribute('contenteditable') === 'true')
      )

      if (event.code === 'Space' && !isInputTarget) {
        event.preventDefault()
        setSpaceHeld(true)
        return
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()

        if (event.shiftKey) {
          void handleRedo()
        } else {
          void handleUndo()
        }

        return
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        void handleRedo()
        return
      }

      if (isInputTarget) {
        return
      }

      const key = event.key.toLowerCase()

      if (key === 'v') {
        event.preventDefault()
        setCanvasToolMode('select')
      }

      if (key === 't') {
        event.preventDefault()
        handleAddTextRef.current?.()
      }

      if (key === 'i') {
        event.preventDefault()
        setLeftTab('imagen')
      }

      if (key === 's') {
        event.preventDefault()
        setActiveRightPanel('properties')
        setRightTab('assets')
      }

      if (key === 'r') {
        setCanvasToolMode('rect')
      }

      if (key === 'p') {
        event.preventDefault()
        setCanvasToolMode('pen')
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      // Duplicate (Ctrl+D / Cmd+D)
      if ((event.metaKey || event.ctrlKey) && key === 'd') {
        event.preventDefault();
        const active = canvas.getActiveObject();
        if (active) {
          active.clone().then((cloned) => {
            canvas.discardActiveObject();
            cloned.set({
              left: (cloned.left ?? 0) + 20,
              top: (cloned.top ?? 0) + 20,
              evented: true,
            });
            
            if (cloned instanceof ActiveSelection) {
              const selection = cloned as ActiveSelection;
              selection.canvas = canvas;
              selection.forEachObject((obj: FabricObject) => canvas.add(obj));
              selection.setCoords();
            } else {
              canvas.add(cloned);
            }
            canvas.setActiveObject(cloned);
            canvas.requestRenderAll();
            commitCanvasMutation();
          });
        }
        return;
      }

      // Delete (Delete / Backspace)
      if (key === 'delete' || key === 'backspace') {
        event.preventDefault();
        const active = canvas.getActiveObjects();
        if (active.length > 0) {
          active.forEach(obj => canvas.remove(obj));
          canvas.discardActiveObject();
          canvas.requestRenderAll();
          commitCanvasMutation();
        }
        return;
      }

      // Select All (Ctrl+A)
      if ((event.metaKey || event.ctrlKey) && key === 'a') {
        event.preventDefault();
        const all = canvas.getObjects().filter(o => !o.get('isLocked'));
        const selection = new ActiveSelection(all, { canvas });
        canvas.setActiveObject(selection);
        canvas.requestRenderAll();
        return;
      }

      // Group (Ctrl+G)
      if ((event.metaKey || event.ctrlKey) && key === 'g') {
        event.preventDefault();
        const active = canvas.getActiveObject();
        if (active instanceof ActiveSelection) {
          (active as GroupableActiveSelection).toGroup()
          canvas.requestRenderAll();
          commitCanvasMutation();
        }
        return;
      }

      // Ungroup (Ctrl+Shift+G)
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && key === 'g') {
        event.preventDefault();
        const active = canvas.getActiveObject();
        if (active && (active as UngroupableFabricObject).type === 'group') {
          ;(active as UngroupableFabricObject).toActiveSelection?.()
          canvas.requestRenderAll();
          commitCanvasMutation();
        }
        return;
      }

      // Movement (Arrows)
      const isArrow = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key);
      if (isArrow) {
        event.preventDefault();
        const active = canvas.getActiveObject();
        if (active) {
          const step = event.shiftKey ? 10 : 1;
          switch (key) {
            case 'arrowup': active.set('top', active.top - step); break;
            case 'arrowdown': active.set('top', active.top + step); break;
            case 'arrowleft': active.set('left', active.left - step); break;
            case 'arrowright': active.set('left', active.left + step); break;
          }
          active.setCoords();
          canvas.requestRenderAll();
          commitCanvasMutation();
        }
        return;
      }

      // Discard (Esc)
      if (key === 'escape') {
        if (activeToolRef.current === 'pen') {
          clearPenDrawing()
          setCanvasToolMode('select')
          canvas.requestRenderAll()
          return
        }

        canvas.discardActiveObject();
        canvas.requestRenderAll();
        return;
      }

      if (key === 'c') {
        setCanvasToolMode('circle')
      }

      if (key === 'l') {
        setCanvasToolMode('line')
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedObjectRef.current) {
        if (selectedObjectRef.current.get('isLocked')) {
          return
        }

        canvasRef.current?.remove(selectedObjectRef.current)
        updateSelectedObject()
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setSpaceHeld(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [clearPenDrawing, commitCanvasMutation, handleRedo, handleUndo, setCanvasToolMode, updateSelectedObject])

  const updateSelectedObjectProperty = useCallback(
    (properties: Partial<FabricObject>) => {
      const canvas = canvasRef.current
      const object = selectedObjectRef.current

      if (!canvas || !object || object.get('isLocked')) {
        return
      }

      object.set(properties)
      canvas.requestRenderAll()
      commitCanvasMutation()
      updateSelectedObject()
    },
    [commitCanvasMutation, updateSelectedObject]
  )

  const updateTextboxProperty = useCallback(
    (props: TextboxPropertyUpdate) => {
      const canvas = canvasRef.current
      const active = selectedObjectRef.current
      if (!active) return

      // Handle Background Highlight Toggle
      if (props.backgroundHighlight && isTextbox(active)) {
        const data = getEditorData(active) || {}
        const current: BackgroundHighlightData = data.backgroundHighlight || {
          enabled: false,
          padding: 10,
          color: 'rgba(70, 45, 110, 0.2)',
          radius: 8,
        }
        const next = { ...current, ...props.backgroundHighlight }
        
        active.set('data', { ...data, backgroundHighlight: next })

        if (next.enabled && !next.rectId) {
          const highlightRectId = `bg-${String(active.get('id') ?? createSlideId())}`
          const rect = new Rect({
            fill: next.color,
            rx: next.radius,
            ry: next.radius,
            selectable: false,
            evented: false,
            data: { role: 'text-highlight' },
          })
          rect.set('id', highlightRectId)
          active.set('data', { ...data, backgroundHighlight: { ...next, rectId: highlightRectId } })
          canvas?.add(rect)
          canvas?.sendObjectToBack(rect)
        } else if (!next.enabled && next.rectId) {
          const rect = canvas?.getObjects().find((object) => getFabricObjectId(object) === next.rectId)
          if (rect) canvas?.remove(rect)
          active.set('data', { ...data, backgroundHighlight: { ...next, rectId: null } })
        }
        
        syncLinkedBackground(active)
      }

      // Handle Gradient Stroke
      if (props.gradientStroke && isTextbox(active)) {
        const data = getEditorData(active) || {}
        active.set('data', { ...data, gradientStroke: { ...data.gradientStroke, ...props.gradientStroke } })
        if (props.gradientStroke.enabled) {
          active.set('stroke', 'transparent') // Force custom render
        }
      }

      // Handle Path/Arc Text Transformation
      if (props.pathText && isTextbox(active) && canvas) {
        const { type, enabled, radius, startAngle, endAngle } = props.pathText
        if (enabled && (active.type === 'textbox' || active.type === 'itext')) {
          const arcOptions = {
            radius: radius || 300,
            startAngle: startAngle || -90,
            endAngle: endAngle || 90,
            fontSize: active.fontSize || 40,
            fontFamily: active.fontFamily || 'Inter',
            fill:
              typeof active.fill === 'string' || active.fill instanceof Gradient
                ? active.fill
                : '#E0E5EB',
            fontWeight: active.fontWeight,
            fontStyle: active.fontStyle,
          }

          const curvedGroup = type === 'circle' 
            ? makeTextOnCircle(active.text || '', arcOptions)
            : makeTextOnArc(active.text || '', arcOptions)

          curvedGroup.set({
            left: active.left,
            top: active.top,
            angle: active.angle,
          })

          // Store reference to restore
          const curvedGroupWithData = curvedGroup as Group & FabricObjectWithData
          curvedGroupWithData.data = {
            ...(curvedGroupWithData.data ?? {}),
            originalTextbox: active.toObject(),
          }

          canvas.remove(active)
          canvas.add(curvedGroup)
          canvas.setActiveObject(curvedGroup)
        }
      }

      updateSelectedObjectProperty(props)
    },
    [updateSelectedObjectProperty, syncLinkedBackground]
  )

  const updateShapeProperty = useCallback(
    (properties: Partial<Rect & Ellipse & Line>) => {
      updateSelectedObjectProperty(properties as Partial<FabricObject>)
    },
    [updateSelectedObjectProperty]
  )

  const handleBackgroundFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })

    await applyBackgroundUpdate((background) => ({
      ...background,
      imageThumb: dataUrl,
      imageUrl: dataUrl,
      type: 'image',
    }))
  }

  const handleDroppedFile = useCallback(
    async (file: File) => {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(file)
      })

      await applyBackgroundUpdate((background) => ({
        ...background,
        imageThumb: dataUrl,
        imageUrl: dataUrl,
        type: 'image',
      }))
    },
    [applyBackgroundUpdate]
  )

  const handleDuplicateSlide = useCallback(() => {
    const current = editorStateRef.current

    if (!current) {
      return
    }

    persistCurrentCanvas({ markDirty: true, refreshPreview: true })

    const source = current.slides[current.activeSlideIndex]

    if (!source) {
      return
    }

    const duplicate: CarouselEditorSlide = {
      ...source,
      id: createSlideId(),
      originalData: {
        ...source.originalData,
      },
    }

    const nextSlides = normalizeSlideNumbers([
      ...current.slides.slice(0, current.activeSlideIndex + 1),
      duplicate,
      ...current.slides.slice(current.activeSlideIndex + 1),
    ])

    setEditorState({
      activeSlideIndex: current.activeSlideIndex + 1,
      isDirty: true,
      slides: nextSlides,
    })

    historiesRef.current[duplicate.id] = {
      cursor: 0,
      states: duplicate.fabricJSON ? [duplicate.fabricJSON] : [],
    }

    void loadSlideToCanvas(nextSlides[current.activeSlideIndex + 1], nextSlides.length)
  }, [loadSlideToCanvas, persistCurrentCanvas])

  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean
    title: string
    message: string
    confirmLabel?: string
    onConfirm: () => void
    variant?: 'danger' | 'warning' | 'info'
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} })

  const handleDeleteSlide = useCallback(() => {
    const current = editorStateRef.current

    if (!current || current.slides.length <= 1) {
      return
    }

    setConfirmation({
      isOpen: true,
      title: '¿Eliminar este slide?',
      message: 'Esta acción no se puede deshacer y perderás todo el contenido de este slide.',
      confirmLabel: 'Eliminar',
      variant: 'danger',
      onConfirm: () => {
        const nextSlides = normalizeSlideNumbers(current.slides.filter((_, index) => index !== current.activeSlideIndex))
        const nextIndex = Math.max(0, current.activeSlideIndex - 1)

        setEditorState({
          activeSlideIndex: nextIndex,
          isDirty: true,
          slides: nextSlides,
        })

        void loadSlideToCanvas(nextSlides[nextIndex], nextSlides.length)
      }
    })
  }, [loadSlideToCanvas])

  const handleAttemptClose = useCallback(() => {
    if (editorState.isDirty) {
      setConfirmation({
        isOpen: true,
        title: 'Cambios sin guardar',
        message: 'Tienes cambios que no han sido guardados. ¿Estás seguro de que quieres salir? Se perderán los cambios recientes.',
        confirmLabel: 'Salir de todos modos',
        variant: 'warning',
        onConfirm: () => onClose()
      })
      return
    }

    onClose()
  }, [editorState.isDirty, onClose])

  const calculateCoherence = useCallback(() => {
    if (editorState.slides.length <= 1) {
      setCoherenceScore(100)
      return
    }

    let score = 0
    const slideStates = editorState.slides

    const fontsHeading = new Set(slideStates.map(s => {
      try {
        if (!s.fabricJSON) return null
        const json = JSON.parse(s.fabricJSON) as ParsedFabricJson
        const objects = getParsedFabricObjects(json)
        const headline = objects.find((object) => object.data?.role === 'headline')
        return headline?.fontFamily
      } catch { return null }
    }).filter(Boolean))
    
    if (fontsHeading.size === 1) score += 25
    else if (fontsHeading.size === 2) score += 15

    const fontsBody = new Set(slideStates.map(s => {
      try {
        if (!s.fabricJSON) return null
        const json = JSON.parse(s.fabricJSON) as ParsedFabricJson
        const objects = getParsedFabricObjects(json)
        const body = objects.find((object) => object.data?.role === 'body')
        return body?.fontFamily
      } catch { return null }
    }).filter(Boolean))
    
    if (fontsBody.size === 1) score += 25
    else if (fontsBody.size === 2) score += 15

    const accents = new Set(slideStates.map(s => {
      try {
        if (!s.fabricJSON) return null
        const json = JSON.parse(s.fabricJSON) as ParsedFabricJson
        const objects = getParsedFabricObjects(json)
        const decorator = objects.find((object) => object.data?.role === 'decorator')
        return decorator?.fill || decorator?.stroke
      } catch { return null }
    }).filter(Boolean))
    
    if (accents.size === 1) score += 25

    const bgTypes = new Set(slideStates.map(s => s.background.type))
    if (bgTypes.size === 1) score += 25
    else if (bgTypes.size === 2) score += 10

    setCoherenceScore(Math.min(100, score))
  }, [editorState.slides])

  useEffect(() => {
    const timer = setTimeout(calculateCoherence, 500)
    return () => clearTimeout(timer)
  }, [editorState.slides, calculateCoherence])

  const handleApplyThemeToAll = useCallback(async () => {
    if (!editorState) return
    setIsSavingAll(true)

    try {
      const updatedSlides = await applyThemeToAllSlides(editorState.slides, activeTheme)
      
      const newState = {
        ...editorState,
        slides: updatedSlides,
        isDirty: true
      }
      
      setEditorState(newState)
      editorStateRef.current = newState
      setShowThemeConfirm(false)

      const currentSlide = updatedSlides[editorState.activeSlideIndex]
      if (currentSlide?.fabricJSON && canvasRef.current) {
        await canvasRef.current.loadFromJSON(currentSlide.fabricJSON)
        await applySlideBackground(canvasRef.current, currentSlide.background)
        canvasRef.current.renderAll()
      }
    } catch (error) {
      console.error('Error applying theme:', error)
    } finally {
      setIsSavingAll(false)
    }
  }, [activeTheme, editorState])

  const handleGlobalFontChange = useCallback(async (font: string) => {
    if (!editorState) return
    setIsSavingAll(true)
    try {
      const updatedSlides = await Promise.all(editorState.slides.map(async (slide) => {
        if (!slide.fabricJSON) return slide
        const offCanvas = new StaticCanvas(undefined, { width: 1080, height: 1080 })
        await offCanvas.loadFromJSON(slide.fabricJSON)
        offCanvas.getObjects().forEach(obj => {
          if (['headline', 'stat', 'counter'].includes(getEditorData(obj)?.role ?? '')) {
            obj.set('fontFamily', font)
          }
        })
        const res = { ...slide, fabricJSON: JSON.stringify(offCanvas.toJSON()) }
        offCanvas.dispose()
        return res
      }))
      setEditorState({ ...editorState, slides: updatedSlides })
    } finally {
      setIsSavingAll(false)
    }
  }, [editorState])

  const handleGlobalAccentChange = useCallback(async (color: string) => {
    if (!editorState) return
    setIsSavingAll(true)
    try {
      const updatedSlides = await Promise.all(editorState.slides.map(async (slide) => {
        if (!slide.fabricJSON) return slide
        const offCanvas = new StaticCanvas(undefined, { width: 1080, height: 1080 })
        await offCanvas.loadFromJSON(slide.fabricJSON)
        offCanvas.getObjects().forEach(obj => {
          const role = getEditorData(obj)?.role
          if (role === 'decorator' || role === 'counter' || role === 'eyebrow' || role === 'icon') {
            obj.set('fill', color)
            const objectWithData = obj as FabricObjectWithData
            if (objectWithData.stroke && (objectWithData.strokeWidth ?? 0) > 0) obj.set('stroke', color)
          }
        })
        const res = { ...slide, fabricJSON: JSON.stringify(offCanvas.toJSON()) }
        offCanvas.dispose()
        return res
      }))
      setEditorState({ ...editorState, slides: updatedSlides })
    } finally {
      setIsSavingAll(false)
    }
  }, [editorState])

  const handleGlobalScaleChange = useCallback(async (isIncrease: boolean) => {
    if (!editorState) return
    const factor = isIncrease ? 1.1 : 0.9
    setIsSavingAll(true)
    try {
      const updatedSlides = await Promise.all(editorState.slides.map(async (slide) => {
        if (!slide.fabricJSON) return slide
        const offCanvas = new StaticCanvas(undefined, { width: 1080, height: 1080 })
        await offCanvas.loadFromJSON(slide.fabricJSON)
        offCanvas.getObjects().forEach(obj => {
          if (isTextbox(obj)) {
            const currentSize = obj.fontSize || 48
            obj.set('fontSize', Math.round(currentSize * factor))
          }
        })
        const res = { ...slide, fabricJSON: JSON.stringify(offCanvas.toJSON()) }
        offCanvas.dispose()
        return res
      }))
      setEditorState({ ...editorState, slides: updatedSlides })
    } finally {
      setIsSavingAll(false)
    }
  }, [editorState])

  const handleAddSlide = useCallback(async () => {
    const current = editorStateRef.current

    if (!current) {
      return
    }

    const blankSlide: CarouselEditorSlide = {
      background: {
        solidColor: '#101417',
        type: 'solid',
      },
      fabricJSON: null,
      id: createSlideId(),
      originalData: {
        bg_reasoning: '',
        bg_type: 'solid',
        body: 'Describe aquí el punto clave que quieres desarrollar.',
        color_suggestion: null,
        design_note: 'Editor slide',
        gradient_style: null,
        headline: 'Nuevo slide',
        slide_number: current.activeSlideIndex + 2,
        stat_or_example: null,
        type: 'content',
        unsplash_query: null,
        visual_direction: 'Brand dark editorial',
        suggested_template: 'editorial',
      },
      previewDataURL: null,
      type: 'content',
    }

    const nextSlides = normalizeSlideNumbers([
      ...current.slides.slice(0, current.activeSlideIndex + 1),
      blankSlide,
      ...current.slides.slice(current.activeSlideIndex + 1),
    ])

    setEditorState({
      activeSlideIndex: current.activeSlideIndex + 1,
      isDirty: true,
      slides: nextSlides,
    })

    await loadSlideToCanvas(nextSlides[current.activeSlideIndex + 1], nextSlides.length)
    commitCanvasMutation()
  }, [commitCanvasMutation, loadSlideToCanvas])

  const handleSaveSlide = useCallback(() => {
    const saved = persistCurrentCanvas({ markDirty: true, refreshPreview: true })

    if (saved?.fabricJSON) {
      pushHistoryState(saved.id, saved.fabricJSON)
    }
  }, [persistCurrentCanvas, pushHistoryState])

  const handleSaveAll = useCallback(async () => {
    const canvas = canvasRef.current
    const current = editorStateRef.current

    if (!canvas || !current) {
      return
    }

    setIsSavingAll(true)
    const savedCurrent = persistCurrentCanvas({ markDirty: true, refreshPreview: true })
    const baseSlides = current.slides.map((slide, index) =>
      index === current.activeSlideIndex && savedCurrent ? savedCurrent : slide
    )

    const finalSlides: CarouselEditorSlide[] = []

    for (const slide of baseSlides) {
      await loadSlideToCanvas(slide, baseSlides.length)
      const serialized = serializeCanvasState(canvas, slide.background)
      const previewDataURL = canvas.toDataURL({ format: 'png', multiplier: 1 })
      finalSlides.push({
        ...slide,
        fabricJSON: serialized,
        previewDataURL,
      })
    }

    const normalizedSlides = normalizeSlideNumbers(finalSlides)
    const slideBackgrounds = normalizedSlides.map((slide, index) =>
      editorBackgroundToSelection(slide.background, index + 1)
    )

    setEditorState({
      activeSlideIndex: Math.min(current.activeSlideIndex, normalizedSlides.length - 1),
      isDirty: false,
      slides: normalizedSlides,
    })

    onSave({
      activeFilterCSS,
      activeFilterId,
      editorSlides: normalizedSlides,
      slideBackgrounds,
      slides: normalizedSlides.map((slide) => slide.originalData),
    })
    setIsSavingAll(false)
  }, [activeFilterCSS, activeFilterId, loadSlideToCanvas, onSave, persistCurrentCanvas])



  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      if (!event.over || event.active.id === event.over.id) {
        return
      }

      const current = editorStateRef.current

      if (!current) {
        return
      }

      persistCurrentCanvas({ markDirty: true, refreshPreview: true })

      const oldIndex = current.slides.findIndex((slide) => slide.id === event.active.id)
      const newIndex = current.slides.findIndex((slide) => slide.id === event.over?.id)

      if (oldIndex < 0 || newIndex < 0) {
        return
      }

      const reorderedSlides = normalizeSlideNumbers(arrayMove(current.slides, oldIndex, newIndex))
      const currentSlideId = current.slides[current.activeSlideIndex]?.id
      const nextActiveIndex = reorderedSlides.findIndex((slide) => slide.id === currentSlideId)

      setEditorState({
        activeSlideIndex: Math.max(nextActiveIndex, 0),
        isDirty: true,
        slides: reorderedSlides,
      })

      if (nextActiveIndex >= 0) {
        await loadSlideToCanvas(reorderedSlides[nextActiveIndex], reorderedSlides.length)
      }
    },
    [loadSlideToCanvas, persistCurrentCanvas]
  )

  const handleAddText = useCallback((options: Partial<ConstructorParameters<typeof Textbox>[1]> = {}) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const center = canvas.getCenterPoint()
    const textbox = createTextbox({
      id: `text-${createSlideId()}`,
      left: center.x - 100,
      top: center.y - 20,
      text: 'Nuevo Texto',
      ...options,
    })
    
    canvas.add(textbox)
    canvas.setActiveObject(textbox)
    textbox.enterEditing()
    canvas.requestRenderAll()
    commitCanvasMutation()
  }, [commitCanvasMutation])

  handleAddTextRef.current = handleAddText

  const handleCanvasDrop = useCallback(
    async (event: ReactDragEvent<HTMLElement>) => {
      event.preventDefault()
      const canvas = canvasRef.current
      if (!canvas) return

      const noctraData = event.dataTransfer.getData('noctra/editor-object')
      const pointer = canvas.getScenePoint(event.nativeEvent)
      const isMultiple = selectedObjectRef.current instanceof ActiveSelection

      // 1. Check for Replacement Logic
      const target = canvas.findTarget(event.nativeEvent)
      
      if (noctraData) {
        const data = JSON.parse(noctraData) as NoctraEditorDropData
        
        // Replacement: Drop on existing object
        if (target && !isMultiple) {
          if (data.type === 'image' && isImage(target)) {
            await target.setSrc(data.url)
            canvas.renderAll()
            commitCanvasMutation()
            return
          }
          if (data.type === 'icon' && isImage(target) && getEditorData(target)?.role === 'icon') {
            const iconTarget = target as FabricImage & FabricObjectWithData
            await iconTarget.setSrc(data.url)
            iconTarget.set('data', { ...(iconTarget.data ?? {}), name: data.name })
            canvas.renderAll()
            commitCanvasMutation()
            return
          }
        }

        // Addition: Drop on empty space (or different type)
        if (data.type === 'image') {
          const img = await FabricImage.fromURL(data.url)
          img.set({
            left: pointer.x,
            top: pointer.y,
            scaleX: 0.5,
            scaleY: 0.5,
          });
          applyDefaultObjectControls(img)
          canvas.add(img)
          canvas.setActiveObject(img)
        } else if (data.type === 'icon') {
          const icon = await FabricImage.fromURL(data.url)
          icon.set({
            left: pointer.x,
            top: pointer.y,
            data: { role: 'icon', name: data.name },
            fill: activeTheme.accent
          });
          applyDefaultObjectControls(icon)
          canvas.add(icon)
          canvas.setActiveObject(icon)
        } else if (data.type === 'shape' && data.category && data.shapeType) {
          addShapeToCanvas(canvas, data.category, data.shapeType, { 
            left: pointer.x, 
            top: pointer.y 
          }, activeTheme.accent)
        }
        
        canvas.renderAll()
        commitCanvasMutation()
        return
      }

      // Handle raw files
      const file = event.dataTransfer.files?.[0]
      if (file && file.type.startsWith('image/')) {
        await handleDroppedFile(file)
      }
    },
    [handleDroppedFile, activeTheme.accent, commitCanvasMutation]
  )

  const activeObject = selectedObject

  const layerActions = [
    {
      label: 'Traer al frente',
      onClick: () => {
        const canvas = canvasRef.current
        const object = selectedObjectRef.current
        if (canvas && object) {
          canvas.bringObjectToFront(object)
          commitCanvasMutation()
        }
      },
    },
    {
      label: 'Enviar al fondo',
      onClick: () => {
        const canvas = canvasRef.current
        const object = selectedObjectRef.current
        if (canvas && object) {
          canvas.sendObjectToBack(object)
          commitCanvasMutation()
        }
      },
    },
    {
      label: 'Subir',
      onClick: () => {
        const canvas = canvasRef.current
        const object = selectedObjectRef.current
        if (canvas && object) {
          canvas.bringObjectForward(object)
          commitCanvasMutation()
        }
      },
    },
    {
      label: 'Bajar',
      onClick: () => {
        const canvas = canvasRef.current
        const object = selectedObjectRef.current
        if (canvas && object) {
          canvas.sendObjectBackwards(object)
          commitCanvasMutation()
        }
      },
    },
  ]

  const renderRightPanel = () => {
    switch (activeRightPanel) {
      case 'feed':
        return (
          <FeedPreview
            slides={editorState.slides}
            activeSlideIndex={editorState.activeSlideIndex}
            onNavigate={(index) => {
              setEditorState((prev) => ({ ...prev, activeSlideIndex: index }))
            }}
            currentSlideImage={currentSlideImage}
            caption={caption}
            hashtags={hashtags}
            aspectRatio="1:1"
            isUpdating={isUpdatingFeed}
          />
        )
      case 'critique':
        return (
          <CritiquePanel
            isAnalyzing={isAnalyzingDesign}
            results={critiqueResults}
            history={critiqueHistory}
            onAnalyze={handleAnalyzeDesign}
            onApplyFix={handleApplyCritiqueFix}
            onClearHistory={() => setCritiqueHistory([])}
            onSelectHistory={(res) => setCritiqueResults(res)}
            cooldown={critiqueCooldown}
          />
        )
      default:
        return (
          <PropertiesPanel
            activeObject={selectedObject}
            activeBackground={activeBackground}
            updateTextboxProperty={updateTextboxProperty}
            updateShapeProperty={updateShapeProperty}
            updateSelectedObjectProperty={updateSelectedObjectProperty}
            applyBackgroundUpdate={applyBackgroundUpdate}
            layerActions={layerActions}
            gradientDraft={gradientDraft}
            setGradientDraft={setGradientDraft}
            handleDuplicateSlide={handleDuplicateSlide}
            handleDeleteSlide={handleDeleteSlide}
            recentFontIds={recentFontIds}
            onOpenImages={() => setLeftTab('imagen')}
            handleBackgroundFile={handleBackgroundFile}
            savedGradients={savedGradients}
            setSavedGradients={setSavedGradients}
            commitCanvasMutation={commitCanvasMutation}
            canvas={canvasRef.current}
            layerVersion={layerVersion}
          />
        )
    }
  }

  const propertiesPanel = renderRightPanel()

  if (!isDesktopSize) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-[#0A0C0F] p-8 text-center">
        <div className="rounded-full border border-white/10 bg-white/5 p-4">
          <Monitor className="h-8 w-8 text-[#4E576A]" />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-medium text-[#E0E5EB]">
            Editor disponible solo en desktop
          </p>
          <p className="text-sm text-[#8D95A6] max-w-xs">
            Necesitas una pantalla de al menos 1280px para usar el editor de carrusel completo.
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-full border border-white/10 px-6 py-2.5 text-sm text-[#E0E5EB] transition-colors hover:bg-white/5"
        >
          Volver
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] bg-[#0A0C0F] text-[#E0E5EB]">
      <div className="flex h-full flex-col">
        {/* HEADER REORGANIZADO — 4 ZONAS */}
        <header className="flex h-[52px] flex-shrink-0 items-center justify-between border-b border-white/8 bg-[#0F1317] px-4 gap-4">
          
          {/* ZONA 1 — Herramientas de dibujo (izquierda fija) */}
          <div className="flex flex-shrink-0 items-center gap-1">
            {[
              { icon: MousePointer2, key: 'select', label: 'V' },
              { icon: Type, key: 'text', label: 'T' },
              { icon: RectangleHorizontal, key: 'rect', label: 'R' },
              { icon: CircleIcon, key: 'circle', label: 'C' },
              { icon: Minus, key: 'line', label: 'L' },
              { icon: PenLine, key: 'pen', label: 'P' },
            ].map((tool) => (
              <button
                key={tool.key}
                type="button"
                onClick={() => setCanvasToolMode(tool.key as EditorTool)}
                className={`${TOOL_BUTTON_CLASS} ${
                  activeTool === tool.key ? 'border-[#4E576A] bg-[#212631] text-[#E0E5EB]' : 'border-white/8'
                }`}
                title={tool.label}
              >
                <tool.icon className="h-4 w-4" />
              </button>
            ))}
          </div>

          {/* ZONA 2 — Acciones contextuales y tipografía (centro izquierda) */}
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
            {activeTool === 'pen' && (
              <div className="ml-2 flex items-center gap-2 rounded-xl border border-white/8 bg-[#14171C] px-3 py-1.5">
                <span className="text-[10px] uppercase text-[#4E576A]">Grosor</span>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={penWidth}
                  onChange={(event) => setPenWidth(Number(event.target.value))}
                  className="w-16 accent-[#462D6E]"
                />
                <span className="text-[10px] font-mono text-[#E0E5EB]">{penWidth}px</span>
                <button
                  type="button"
                  className="h-5 w-5 cursor-pointer rounded-full border border-white/20"
                  style={{ backgroundColor: penColor }}
                  onClick={() => {
                    penColorInputRef.current?.click()
                    document.dispatchEvent(new CustomEvent('noctra:pen-color'))
                  }}
                  aria-label="Cambiar color del pen"
                />
                <input
                  ref={penColorInputRef}
                  type="color"
                  value={penColor}
                  onChange={(event) => setPenColor(event.target.value.toUpperCase())}
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden="true"
                />
              </div>
            )}

            {isTextbox(activeObject) && (
              <div className="flex items-center gap-1 rounded-xl border border-white/8 bg-[#14171C] px-2 py-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const shadow = activeObject.shadow as Shadow | null
                    if (shadow) {
                      activeObject.set('shadow', null)
                    } else {
                      activeObject.set('shadow', new Shadow({ color: 'rgba(0,0,0,0.5)', blur: 8, offsetX: 4, offsetY: 4 }))
                    }
                    canvasRef.current?.renderAll()
                    commitCanvasMutation()
                  }}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                    activeObject.shadow ? "bg-[#E0E5EB] text-[#101417]" : "text-[#4E576A] hover:bg-white/5 hover:text-[#8D95A6]"
                  )}
                  title="Sombra"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (activeObject.stroke && activeObject.stroke !== 'transparent') {
                      activeObject.set({ stroke: 'transparent', strokeWidth: 0 })
                    } else {
                      activeObject.set({ stroke: '#462D6E', strokeWidth: 2 })
                    }
                    canvasRef.current?.renderAll()
                    commitCanvasMutation()
                  }}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                    (activeObject.stroke && activeObject.stroke !== 'transparent') ? "bg-[#E0E5EB] text-[#101417]" : "text-[#4E576A] hover:bg-white/5 hover:text-[#8D95A6]"
                  )}
                  title="Contorno"
                >
                  <Type className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const data = getEditorData(activeObject) || {}
                    if (!data.originalText) data.originalText = activeObject.text
                    const isUpper = data.textTransform === 'upper'
                    const nextText = isUpper ? data.originalText : data.originalText.toUpperCase()
                    activeObject.set({ text: nextText, data: { ...data, textTransform: isUpper ? 'original' : 'upper' } })
                    canvasRef.current?.renderAll()
                    commitCanvasMutation()
                  }}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                    getEditorData(activeObject)?.textTransform === 'upper' ? "bg-[#E0E5EB] text-[#101417]" : "text-[#4E576A] hover:bg-white/5 hover:text-[#8D95A6]"
                  )}
                  title="Mayúsculas"
                >
                  <CaseSensitive className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const current = activeObject.charSpacing ?? 0
                    const next = current === 0 ? 150 : 0
                    updateTextboxProperty({ charSpacing: next })
                  }}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                    (activeObject.charSpacing ?? 0) > 0 ? "bg-[#E0E5EB] text-[#101417]" : "text-[#4E576A] hover:bg-white/5 hover:text-[#8D95A6]"
                  )}
                  title="Espaciado"
                >
                  <AlignJustify className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Tipografía Global controls */}
            <div className="flex items-center gap-1 rounded-xl border border-white/8 bg-[#14171C] px-2 py-1 flex-shrink-0">
              <Tooltip content="Unificar Fuente">
                <button 
                  onClick={() => handleGlobalFontChange(activeTheme.fontHeading)}
                  className="flex h-7 items-center gap-2 rounded-lg px-2 text-[10px] font-bold text-[#E0E5EB] transition-colors hover:bg-white/5"
                >
                  <TypeIcon className="h-3 w-3" />
                  Fuente
                </button>
              </Tooltip>
              <div className="h-3 w-[1px] bg-white/10" />
              <Tooltip content="Unificar Acento">
                <button 
                  onClick={() => handleGlobalAccentChange(activeTheme.accent)}
                  className="flex h-7 items-center gap-2 rounded-lg px-2 text-[10px] font-bold text-[#E0E5EB] transition-colors hover:bg-white/5"
                >
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: activeTheme.accent }} />
                  Acento
                </button>
              </Tooltip>
              <div className="h-3 w-[1px] bg-white/10" />
              <button 
                onClick={() => handleGlobalScaleChange(false)} 
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8D95A6] hover:bg-white/5 hover:text-[#E0E5EB]"
              >
                <Baseline className="h-3 w-3" />
              </button>
              <button 
                onClick={() => handleGlobalScaleChange(true)} 
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8D95A6] hover:bg-white/5 hover:text-[#E0E5EB]"
              >
                <Baseline className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ZONA 3 — Acciones del documento (centro derecha) */}
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                const canvas = canvasRef.current
                if (!canvas) return
                const logo = await createLogoObject()
                canvas.add(logo)
                canvas.setActiveObject(logo)
                canvas.requestRenderAll()
                commitCanvasMutation()
              }}
              className={`${TOOL_BUTTON_CLASS} border-white/8`}
              title="Añadir Logo Noctra"
            >
              <NoctraLogoBadge />
            </button>
            
            <button
              type="button"
              onClick={() => setLeftTab('imagen')}
              className={`${TOOL_BUTTON_CLASS} border-white/8`}
              title="Fondo Unsplash"
            >
              <ImageIcon className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => handleAnalyzeDesign()}
              disabled={isAnalyzingDesign || critiqueCooldown > 0}
              className={`${TOOL_BUTTON_CLASS} ${
                activeRightPanel === 'critique' ? 'border-[#462D6E] bg-[#462D6E]/20 text-white' : 'border-white/8'
              }`}
              title="Criticar con IA"
            >
              <Sparkles className={cn("h-4 w-4", isAnalyzingDesign && "animate-pulse")} />
            </button>

            <button
              type="button"
              onClick={() => void openPreview()}
              className={`${TOOL_BUTTON_CLASS} border-white/8`}
              title="Vista previa"
            >
              <Eye className="h-4 w-4" />
            </button>

            <div className="mx-1 h-6 w-px bg-white/8" />

            <button
              type="button"
              onClick={() => void handleUndo()}
              disabled={!canUndo}
              className={`${TOOL_BUTTON_CLASS} ${!canUndo ? 'opacity-40 cursor-not-allowed' : 'border-white/8'}`}
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => void handleRedo()}
              disabled={!canRedo}
              className={`${TOOL_BUTTON_CLASS} ${!canRedo ? 'opacity-40 cursor-not-allowed' : 'border-white/8'}`}
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>

          {/* ZONA 4 — Guardar / Exportar / Cerrar (derecha fija) */}
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleSaveSlide}
              className="rounded-xl border border-[#4E576A] px-3 py-1.5 text-[11px] text-[#E0E5EB] transition-colors hover:bg-[#212631]"
            >
              Guardar slide
            </button>
            <button
              type="button"
              onClick={() => void handleSaveAll()}
              disabled={isSavingAll}
              className="rounded-xl bg-[#E0E5EB] px-3 py-1.5 text-[11px] font-bold text-[#101417] transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isSavingAll ? '...' : 'Guardar todo'}
            </button>

            <div className="mx-1 h-6 w-px bg-white/8" />

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  handleAutoSaveVersion('Exportación')
                  setIsExportDialogOpen(true)
                }}
                className="flex items-center gap-2 rounded-xl bg-[#462D6E] px-3 py-1.5 text-[11px] font-bold text-white transition-all hover:bg-[#5A3B8E]"
              >
                <Download className="h-3.5 w-3.5" />
                Exportar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const currentSlide = editorState.slides[editorState.activeSlideIndex]
                  if (currentSlide) {
                    handleAutoSaveVersion('Exportación Rápida')
                    await quickExportCurrentSlide(currentSlide, `noctra-slide-${editorState.activeSlideIndex + 1}`, activeFilterCSS)
                    if (postId) handleExportSuccess(postId, 'quick_png', 'png')
                  }
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#8D95A6] hover:text-[#E0E5EB]"
              >
                <Zap className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mx-1 h-6 w-px bg-white/8" />
            
            <button
              type="button"
              onClick={() => setRulerEnabled(!rulerEnabled)}
              className={`${TOOL_BUTTON_CLASS} ${rulerEnabled ? 'border-[#4E576A] bg-[#212631] text-[#E0E5EB]' : 'border-white/8'}`}
            >
              <Ruler className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setGridEnabled(!gridEnabled)}
              className={`${TOOL_BUTTON_CLASS} ${gridEnabled ? 'border-[#4E576A] bg-[#212631] text-[#E0E5EB]' : 'border-white/8'}`}
            >
              <Grid className="h-4 w-4" />
            </button>

            <div className="mx-1 h-6 w-px bg-white/8" />

            <button
              type="button"
              onClick={handleAttemptClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#8D95A6] hover:bg-white/5 hover:text-[#E0E5EB]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* LAYOUT PRINCIPAL CON SIDEBARS FIJOS */}
        <div className="grid min-h-0 flex-1 gap-3 p-3" style={{ gridTemplateColumns: '220px minmax(0,1fr) 260px' }}>
          
          {/* SIDEBAR IZQUIERDO */}
          <aside
            className={`${PANEL_CLASS} flex flex-col overflow-hidden`}
            style={{ height: 'calc(100vh - 64px - 24px)' }}
          >
            <div className="flex-shrink-0 px-4 py-3">
              <div className="flex items-center justify-between gap-2 border-b border-white/8 pb-3 flex-shrink-0">
                {[
                  { key: 'slides', label: 'Slides', shortLabel: 'SL' },
                  { key: 'tema', label: 'Tema', shortLabel: 'TM' },
                  { key: 'imagen', label: 'Imagen', shortLabel: 'IMG' },
                  { key: 'filtros', label: 'Filtros', shortLabel: 'FX' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setLeftTab(tab.key as LeftTab)}
                    title={tab.label}
                    className={cn(
                      "flex-1 rounded-lg py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors",
                      leftTab === tab.key
                        ? "bg-white/10 text-[#E0E5EB]"
                        : "text-[#4E576A] hover:text-[#8D95A6]"
                    )}
                  >
                    {tab.shortLabel}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setIsVersionPanelOpen(true)}
                  title="Historial de versiones"
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                    isVersionPanelOpen ? "bg-white/10 text-[#E0E5EB]" : "text-[#4E576A] hover:text-[#8D95A6]"
                  )}
                >
                  <HistoryIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
              {leftTab === 'slides' ? (
                <div className="space-y-4">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => void handleDragEnd(event)}>
                    <SortableContext items={editorState.slides.map((slide) => slide.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-4">
                        {editorState.slides.map((slide, index) => (
                          <SortableSlideThumb
                            key={slide.id}
                            isSelected={index === editorState.activeSlideIndex}
                            onSelect={() => void switchToSlide(index)}
                            onSetTab={setLeftTab}
                            slide={slide}
                            totalSlides={editorState.slides.length}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              ) : leftTab === 'tema' ? (
                <ThemePanel
                  currentThemeId={currentThemeId}
                  onSelectTheme={setCurrentThemeId}
                  activeTheme={activeTheme}
                  customThemes={customThemes}
                  onApplyAll={() => setShowThemeConfirm(true)}
                  editingCustomTheme={editingCustomTheme}
                  setEditingCustomTheme={setEditingCustomTheme}
                  onSaveCustomTheme={(t) => setCustomThemes(saveCustomTheme(t))}
                  coherenceScore={coherenceScore}
                />
              ) : leftTab === 'imagen' ? (
                <ImagePanel
                  canvas={canvasRef.current}
                  caption={caption}
                  angle={angle}
                  platform={platform}
                  slideType={editorState.slides[editorState.activeSlideIndex]?.type}
                  postId={postId}
                  slideIndex={editorState.activeSlideIndex}
                  onCommit={commitCanvasMutation}
                />
              ) : leftTab === 'filtros' ? (
                <FilterPanel
                  activeFilterId={activeFilterId}
                  onFilterChange={handleFilterChange}
                  canvasPreviewDataURL={canvasPreviewDataURL}
                />
              ) : null}
            </div>

            {leftTab === 'slides' && (
              <div className="flex-shrink-0 space-y-3 border-t border-white/8 px-3 py-3">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[9px] uppercase font-bold tracking-wider text-[#4E576A]">
                    <span>Coherencia</span>
                    <span className={coherenceScore >= 80 ? "text-green-500" : "text-yellow-500"}>{coherenceScore}%</span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
                    <div className="h-full bg-[#462D6E] transition-all" style={{ width: `${coherenceScore}%` }} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void handleAddSlide()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#2A3040] py-2.5 text-[11px] font-bold text-[#8D95A6] transition-colors hover:border-[#4E576A] hover:text-[#E0E5EB] hover:bg-white/5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  AGREGAR SLIDE
                </button>
              </div>
            )}
          </aside>

          {/* MAIN WORKSPACE — ILLUSTRATOR STYLE */}
          <main
            ref={workAreaRef}
            className={`${PANEL_CLASS} relative min-h-0 overflow-hidden select-none bg-[#060809] cursor-default ${spaceHeld ? 'cursor-grab' : ''} ${isPanning ? '!cursor-grabbing' : ''}`}
            style={{ touchAction: 'none' }}
            onPointerDown={(e) => {
              const fabricEl = canvasElementRef.current
              if (
                fabricEl &&
                e.target instanceof Node &&
                (e.target === fabricEl || fabricEl.contains(e.target))
              ) {
                if (spaceHeld && e.button === 0) {
                  e.preventDefault()
                  isPanningRef.current = true
                  setIsPanning(true)
                  panStartRef.current = {
                    x: e.clientX,
                    y: e.clientY,
                    ox: canvasOffset.x,
                    oy: canvasOffset.y,
                  }
                }
                return
              }

              const isMiddlePan = e.button === 1
              if (!isMiddlePan) return

              e.preventDefault()
              isPanningRef.current = true
              setIsPanning(true)
              panStartRef.current = { x: e.clientX, y: e.clientY, ox: canvasOffset.x, oy: canvasOffset.y }
              if (workAreaRef.current) workAreaRef.current.setPointerCapture(e.pointerId)
            }}
            onPointerMove={(e) => {
              if (!isPanning || !panStartRef.current) return
              const dx = e.clientX - panStartRef.current.x
              const dy = e.clientY - panStartRef.current.y
              setCanvasOffset({ x: panStartRef.current.ox + dx, y: panStartRef.current.oy + dy })
            }}
            onPointerUp={(e) => {
              if (isPanning) {
                isPanningRef.current = false
                setIsPanning(false)
                panStartRef.current = null

                try {
                  workAreaRef.current?.releasePointerCapture(e.pointerId)
                } catch {
                  // Ignore when pointer capture was never set on the work area.
                }
              }
            }}
            onPointerLeave={() => {
              if (isPanning) {
                isPanningRef.current = false
                setIsPanning(false)
                panStartRef.current = null
              }
            }}
            onWheel={(e) => {
              if (!e.ctrlKey && !e.metaKey) return
              e.preventDefault()
              const delta = e.deltaY > 0 ? -0.05 : 0.05
              setCanvasScale(prev => Math.max(0.2, Math.min(1.5, prev + delta)))
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => { void handleCanvasDrop(event) }}
          >
            <CanvasToolbar
              activeObject={selectedObject}
              onDelete={handleDeleteSelection}
              onDuplicate={handleDuplicateSelection}
              onBringForward={handleBringForwardSelection}
              onSendBackward={handleSendBackwardSelection}
              onToggleLock={handleToggleLockSelection}
              isLocked={isActiveObjectLocked}
              onPreview={() => void openPreview()}
              onUndo={() => void handleUndo()}
              onRedo={() => void handleRedo()}
              canUndo={canUndo}
              canRedo={canRedo}
            />

            {selectedObject instanceof Textbox && (
              <TextToolbar
                canvas={canvasRef.current}
                object={selectedObject as Textbox}
                onCommit={commitCanvasMutation}
                position={textToolbarPos}
              />
            )}

            {/* Contextual Bar (Floating when active) */}
            {selectedObject && (
              <div className="absolute top-8 left-1/2 z-50 -translate-x-1/2">
                <ContextualBar
                  canvas={canvasRef.current}
                  selectedObject={selectedObject}
                  onCommit={commitCanvasMutation}
                  onDelete={handleDeleteSelection}
                  onDuplicate={handleDuplicateSelection}
                  onBringForward={handleBringForwardSelection}
                  onSendBackward={handleSendBackwardSelection}
                  onToggleLock={handleToggleLockSelection}
                  onVerticalAlign={handleVerticalAlign}
                />
              </div>
            )}

            {/* Background Texture */}
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            {rulerEnabled && (
              <div className="pointer-events-none absolute inset-0 z-30">
                <div
                  className="pointer-events-none absolute border-r border-b border-white/8 bg-[#0D1014]"
                  style={{
                    left: 0,
                    top: 0,
                    width: 20,
                    height: 20,
                    zIndex: 41,
                  }}
                />
                <CanvasRuler
                  canvasSize={CANVAS_SIZE}
                  orientation="horizontal"
                  scale={canvasScale}
                  offset={canvasLeft}
                />
                <CanvasRuler
                  canvasSize={CANVAS_SIZE}
                  orientation="vertical"
                  scale={canvasScale}
                  offset={canvasTop}
                />
              </div>
            )}

            {/* THE CANVAS CONTAINER */}
            <div
              className="absolute rounded-[2px] bg-[#101417]"
              style={{
                boxShadow: '0 0 0 1px rgba(255,255,255,0.12), 0 20px 60px rgba(0,0,0,0.8), 0 0 0 4px rgba(0,0,0,0.4)',
                height: canvasDisplaySize,
                width: canvasDisplaySize,
                left: '50%',
                top: '50%',
                transform: `translate(calc(-50% + ${canvasOffset.x}px), calc(-50% + ${canvasOffset.y}px))`,
                transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                position: 'absolute',
                overflow: 'hidden'
              }}
            >
              {/* ISOLATION WRAPPER: React manages this DIV, Fabric manages its contents */}
              <div
                key="canvas-isolation-wrapper"
                className="absolute left-0 top-0 z-10"
                style={{
                  height: CANVAS_SIZE,
                  transform: `scale(${canvasScale})`,
                  transformOrigin: 'top left',
                  width: CANVAS_SIZE,
                }}
              >
                <canvas ref={canvasElementRef} style={{ height: CANVAS_SIZE, width: CANVAS_SIZE }} />
              </div>
              
              {gridEnabled && (
                <div 
                  className="absolute inset-0 pointer-events-none z-20"
                  style={{
                    backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)`,
                    backgroundSize: `${gridSize * canvasScale}px ${gridSize * canvasScale}px`,
                  }}
                />
              )}
            </div>

            {/* WORKSPACE CONTROLS */}
            <div className="absolute bottom-4 right-4 z-20 flex gap-2">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#101417]/90 px-3 py-1.5 backdrop-blur-sm">
                <span className="text-[10px] font-mono text-[#4E576A] uppercase tracking-widest">{Math.round(canvasScale * 100)}%</span>
              </div>
              <button
                onClick={() => { setCanvasOffset({ x: 0, y: 0 }); setCanvasScale(getScaleForCanvas(viewportWidth, viewportHeight)); }}
                className="rounded-full border border-white/10 bg-[#101417]/90 px-3 py-1.5 text-[10px] text-[#4E576A] backdrop-blur-sm transition-colors hover:border-white/20 hover:text-[#E0E5EB] uppercase font-bold tracking-wider"
                title="Centrar canvas"
              >
                ⌖ Centrar
              </button>
            </div>
          </main>

          {/* SIDEBAR DERECHO (PROPERTIES) */}
          <aside
            className={`${PANEL_CLASS} flex flex-col overflow-hidden`}
            style={{ height: 'calc(100vh - 64px - 24px)' }}
          >
            {activeRightPanel === 'properties' ? (
              <>
                <div className="flex flex-shrink-0 items-center gap-1 border-b border-white/8 px-3 pt-3 pb-0">
                  {([
                    { key: 'properties', label: 'Propiedades' },
                    { key: 'assets', label: 'Assets' },
                  ] as const).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setRightTab(tab.key)}
                      className={cn(
                        "flex-1 border-b-2 pb-2.5 text-[11px] font-medium uppercase tracking-wider transition-colors",
                        rightTab === tab.key
                          ? "border-[#E0E5EB] text-[#E0E5EB]"
                          : "border-transparent text-[#4E576A] hover:text-[#8D95A6]"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overflow-x-visible px-3 py-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                  {rightTab === 'properties' ? (
                    propertiesPanel
                  ) : (
                    <AssetPanel
                      canvas={canvasRef.current}
                      activeTheme={activeTheme}
                      onCommit={commitCanvasMutation}
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-visible px-3 py-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                {propertiesPanel}
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Version Panel Overlay */}
      {isVersionPanelOpen && (
        <div className="absolute inset-y-0 left-0 z-[60] w-[320px] shadow-2xl border-r border-white/5 animate-in slide-in-from-left duration-300">
          <VersionPanel
            userId={userId}
            postId={postId || null}
            currentSlides={editorState.slides}
            metadata={{
              angle: angle || '',
              platform: platform || 'instagram',
              postId: postId || null,
              templateIds: [], // We could track template history later
              theme: currentThemeId
            }}
            onRestore={handleRestoreVersion}
            onClose={() => setIsVersionPanelOpen(false)}
          />
        </div>
      )}

      {(isBootstrapping || isSavingAll) ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0A0C0F]/70">
          <div className="rounded-2xl border border-white/10 bg-[#101417] px-5 py-3 text-sm text-[#E0E5EB]">
            {isSavingAll ? 'Guardando slides...' : 'Preparando editor...'}
          </div>
        </div>
      ) : null}
      
      {showThemeConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-[400px] rounded-[32px] border border-white/10 bg-[#101417] p-8 shadow-2xl">
            <div className="mb-6 flex aspect-square w-12 items-center justify-center rounded-2xl bg-white/5">
              <Palette className="h-6 w-6 text-[#E0E5EB]" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-[#E0E5EB]">Aplicar tema global</h3>
            <p className="mb-6 text-sm leading-relaxed text-[#8D95A6]">
              Esto modificará fondos, colores de texto y fuentes en los <span className="font-bold text-[#E0E5EB]">{editorState.slides.length} slides</span>. ¿Continuar?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => void handleApplyThemeToAll()}
                disabled={isSavingAll}
                className="flex w-full items-center justify-center rounded-2xl bg-[#E0E5EB] py-3 text-sm font-bold text-[#101417] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isSavingAll ? "Aplicando..." : "Aplicar tema"}
              </button>
              <button
                onClick={() => setShowThemeConfirm(false)}
                className="w-full rounded-2xl bg-white/5 py-3 text-sm font-bold text-[#E0E5EB] transition-colors hover:bg-white/10"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        slides={editorState.slides}
        postId={postId}
        activeFilterCSS={activeFilterCSS}
        onExportSuccess={handleExportSuccess}
      />

      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        canvasSize={{
          width: canvasRef.current?.getWidth() ?? CANVAS_SIZE,
          height: canvasRef.current?.getHeight() ?? CANVAS_SIZE,
        }}
        networkId={platform}
        formatKey={exportFormatKey}
        activeFilterCSS={activeFilterCSS}
        onConfirmExport={handleDialogExport}
        isExporting={isDialogExporting}
      />

      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        networkId={platform}
        format={previewFormat}
        canvasDataURL={previewDataURL}
        activeFilterCSS={activeFilterCSS}
        onExport={handlePreviewExport}
        isExporting={isPreviewExporting}
        username="noctra.studio"
        displayName="Noctra Studio"
        handle="noctra_studio"
        postText={caption}
        caption={previewCaption}
      />

      <ConfirmationModal
        isOpen={confirmation.isOpen}
        title={confirmation.title}
        message={confirmation.message}
        confirmLabel={confirmation.confirmLabel}
        variant={confirmation.variant}
        onConfirm={confirmation.onConfirm}
        onClose={() => setConfirmation({ ...confirmation, isOpen: false })}
      />
    </div>
  )
}
