import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import type { Platform } from '@/lib/product'
import {
  ensureHashtags,
  formatExportDate,
  joinHashtags,
  plainTextFromMarkdown,
  readInstagramSlides,
  readLinkedInSlides,
  readString,
  readStringArray,
  readXThreadTweets,
  type SlideBackgroundSelection,
  type PostFormat,
} from '@/lib/social-content'
import type { CarouselEditorSlide } from '@/lib/instagram-carousel-editor'
import {
  getLogoVariantForResolvedBackground,
  gradientConfigToCss,
  resolveSlideBackground,
} from '@/lib/carousel-backgrounds'

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function exportInstagramPackage(args: {
  content: Record<string, unknown>
  exportMetadata?: Record<string, unknown> | null
  format: PostFormat
  imageMetadata?: {
    url: string
    photographer: string
    overlay: any
  } | null
}) {
  const { content, exportMetadata, format } = args
  const zip = new JSZip()
  const date = formatExportDate()
  const root = zip.folder(`instagram-export-${date}`)

  if (!root) {
    throw new Error('No fue posible preparar el ZIP de Instagram')
  }

  const caption = readString(content.caption)
  const hashtags = ensureHashtags(readStringArray(content.hashtags))

  const captionSections = [caption]

  if (args.imageMetadata) {
    captionSections.push(
      '',
      'IMAGEN SELECCIONADA:',
      `URL: ${args.imageMetadata.url}`,
      `Fotógrafo: ${args.imageMetadata.photographer} (Unsplash)`,
      '',
      'OVERLAY:',
      `Texto: ${args.imageMetadata.overlay?.text || 'Sin texto'}`,
      `Posición: ${args.imageMetadata.overlay?.placement || 'center'}`,
      `Oscurecimiento: ${Math.round((args.imageMetadata.overlay?.dimming || 0) * 100)}%`
    )
  }

  if (hashtags.length > 0) {
    captionSections.push('---', `Hashtags: ${joinHashtags(hashtags)}`)
  }

  root.file('caption.txt', captionSections.filter(Boolean).join('\n'))

  if (format === 'carousel') {
    const slidesFolder = root.folder('slides')
    const slides = readInstagramSlides(content.slides)

    if (!slidesFolder) {
      throw new Error('No fue posible preparar los slides del ZIP')
    }

    slides.forEach((slide) => {
      const indexLabel = String(slide.slide_number).padStart(2, '0')
      const bgSelections = exportMetadata?.slide_backgrounds as SlideBackgroundSelection[] | undefined
      const editedSlides = exportMetadata?.edited_carousel_slides as CarouselEditorSlide[] | undefined
      const editedSlide = editedSlides?.find((item) => item.originalData.slide_number === slide.slide_number)
      const selection = bgSelections?.find(s => s.slide_number === slide.slide_number)
      const resolvedBackground = resolveSlideBackground(slide, {
        gradientConfig: selection?.gradient_config,
        imageUrl: selection?.image_url,
        solidColor: selection?.solid_color,
        type: selection?.bg_type ?? slide.bg_type,
      })
      const logoAsset =
        getLogoVariantForResolvedBackground(resolvedBackground) === 'light'
          ? 'favicon-light.svg'
          : 'favicon-dark.svg'
      
      const bgType = selection?.bg_type || slide.bg_type
      const sections = [
        `TITULAR: ${slide.headline}`,
        `CUERPO: ${slide.body}`,
        `FONDO: ${bgType.toUpperCase()}`
      ]

      if (bgType === 'image') {
        const url = selection?.image_url || 'Buscar en Unsplash'
        const photographer = selection?.photographer || 'Unsplash'
        sections.push(
          `FOTO SELECCIONADA: ${url}`,
          `FOTOGRÁFO: ${photographer}`,
          `INSTRUCCIÓN: Descarga la foto del link y úsala como fondo en Canva. Agrega un overlay oscuro de 50-60% opacidad antes de agregar el texto.`
        )
      } else if (bgType === 'gradient') {
        const gradientCss = selection?.gradient_config
          ? gradientConfigToCss(selection.gradient_config)
          : slide.color_suggestion
            ? `Sugerencia IA: ${slide.color_suggestion}`
            : selection?.gradient_style || slide.gradient_style || 'linear-gradient(145deg, #101417, #1C2028)'
        sections.push(
          `GRADIENTE: ${gradientCss}`,
          `INSTRUCCIÓN: En Canva, usa un rectángulo con el estilo de gradiente indicado como fondo.`
        )
      } else if (bgType === 'solid') {
        const color =
          selection?.solid_color ||
          slide.color_suggestion ||
          (slide.slide_number % 2 !== 0 ? '#101417' : '#212631')
        sections.push(
          `COLOR: ${color}`,
          `INSTRUCCIÓN: Usa este color sólido como fondo en Canva.`
        )
      }

      sections.push(`LOGO: Agrega ${logoAsset} en esquina inferior derecha, 24px, opacidad 75%`)

      if (editedSlide?.previewDataURL) {
        const pngBase64 = editedSlide.previewDataURL.split(',')[1]

        if (pngBase64) {
          slidesFolder.file(`slide-${indexLabel}-${slide.type}.png`, pngBase64, { base64: true })
          sections.push(
            'NOTA: Este slide fue diseñado en el editor.',
            'USA_DIRECTAMENTE: Usa el archivo .png directamente para publicar este slide.'
          )
        }
      }

      slidesFolder.file(
        `slide-${indexLabel}-${slide.type}.txt`,
        sections.join('\n')
      )
    })

    root.file(
      'guia-rapida.txt',
      [
        'CÓMO PUBLICAR ESTE CARRUSEL',
        '═══════════════════════════',
        '',
        '1. DISEÑO EN CANVA',
        '   - Abre Canva y crea un diseño Instagram Post (1080x1080px)',
        '   - Para slides con FOTO: descarga la imagen del link indicado y úsala como fondo. Agrega un overlay oscuro del 55% para asegurar legibilidad.',
        '   - Para slides con GRADIENTE: usa las indicaciones CSS en cada archivo de slide.',
        '   - Para slides con SÓLIDO: usa el color HEX indicado.',
        '',
        '2. TIPOGRAFÍA',
        '   - Titulares: Satoshi Bold (o DM Sans Bold)',
        '   - Cuerpo: Inter Regular',
        '',
        '3. LOGO',
        '   - Usa favicon-light.svg sobre fondos oscuros y favicon-dark.svg sobre fondos claros.',
        '   - Tamaño: 24x24px, Opacidad: 75%.',
        '',
        '4. PUBLICACIÓN',
        '   - Sube los slides en orden a Instagram.',
        '   - Copia el texto de caption.txt como descripción.',
        '',
        '═══════════════════════════',
        'Generado con social.noctra.studio',
      ].join('\n')
    )
  } else {
    root.file(
      'imagen-sugerida.txt',
      [
        `IMAGEN SUGERIDA: ${readString(content.visual_direction)}`,
        'Tip: usa esa frase en Unsplash o abre /visual desde la app.',
      ].join('\n')
    )
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  saveAs(blob, `instagram-export-${date}.zip`)
}

export async function exportLinkedInPackage(args: {
  content: Record<string, unknown>
  format: PostFormat
  pdfBlob?: Blob | null
  imageMetadata?: {
    url: string
    photographer: string
    overlay: any
  } | null
}) {
  const { content, format, pdfBlob } = args
  const zip = new JSZip()
  const date = formatExportDate()
  const root = zip.folder(`linkedin-export-${date}`)

  if (!root) {
    throw new Error('No fue posible preparar el ZIP de LinkedIn')
  }

  if (format === 'document' || format === 'carousel') {
    root.file(
      'post-caption.txt',
      [
        readString(content.post_caption),
        '---',
        joinHashtags(ensureHashtags(readStringArray(content.hashtags))),
        '---',
        'INSTRUCCIONES:',
        '1. Sube el archivo carousel.pdf a LinkedIn',
        '2. Copia este texto como descripcion del post',
        '3. Agrega una imagen de portada si lo deseas',
        '',
        args.imageMetadata ? [
          'IMAGEN SELECCIONADA:',
          `URL: ${args.imageMetadata.url}`,
          `Fotógrafo: ${args.imageMetadata.photographer} (Unsplash)`,
          '',
          'OVERLAY:',
          `Texto: ${args.imageMetadata.overlay?.text || 'Sin texto'}`,
          `Posición: ${args.imageMetadata.overlay?.placement || 'center'}`,
          `Oscurecimiento: ${Math.round((args.imageMetadata.overlay?.dimming || 0) * 100)}%`
        ].join('\n') : ''
      ].filter(Boolean).join('\n')
    )

    if (!pdfBlob) {
      throw new Error('Falta el PDF para exportar el documento de LinkedIn')
    }

    root.file('carousel.pdf', pdfBlob)
  } else if (format === 'image') {
    root.file(
      'post-caption.txt',
      [
        readString(content.caption),
        '---',
        joinHashtags(ensureHashtags(readStringArray(content.hashtags))),
      ].join('\n')
    )
    root.file(
      'imagen-sugerida.txt',
      [
        `IMAGEN SUGERIDA: ${readString(content.visual_direction)}`,
        'Busca esta imagen en: unsplash.com o en /visual de la app',
      ].join('\n')
    )
  } else {
    root.file(
      'post.txt',
      [
        readString(content.caption),
        '---',
        joinHashtags(ensureHashtags(readStringArray(content.hashtags))),
      ].join('\n')
    )
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  saveAs(blob, `linkedin-export-${date}.zip`)
}

export function exportXPackage(args: {
  content: Record<string, unknown>
  format: PostFormat
  idea: string
  imageMetadata?: {
    url: string
    photographer: string
    overlay: any
  } | null
}) {
  const { content, format, idea } = args
  const date = formatExportDate()

  if (format === 'article') {
    downloadTextFile(
      `x-article-${date}.txt`,
      [
        '═══════════════════════════════',
        `ARTICULO PARA X - ${date}`,
        '═══════════════════════════════',
        `TITULO: ${readString(content.title)}`,
        `SUBTITULO: ${readString(content.subtitle)}`,
        `TIEMPO DE LECTURA: ${String(content.read_time_minutes ?? '')} min`,
        '═══════════════════════════════',
        '',
        plainTextFromMarkdown(readString(content.body)),
        '',
        '═══════════════════════════════',
        'INSTRUCCIONES',
        '═══════════════════════════════',
        '1. Ve a X -> redactar -> icono de articulo',
        '2. Pega el titulo y el cuerpo',
        '3. Publica o programa',
      ].join('\n')
    )

    return
  }

  if (format === 'thread') {
    const tweets = readXThreadTweets(content.tweets ?? content.thread)
    const total = tweets.length
    const blocks = tweets.flatMap((tweet) => [
      `[${tweet.number}/${total}]`,
      tweet.content,
      `(${tweet.char_count} caracteres)`,
      '',
    ])

    downloadTextFile(
      `x-thread-${date}.txt`,
      [
        '═══════════════════════════════',
        `HILO PARA X - ${date}`,
        `Idea: ${idea}`,
        '═══════════════════════════════',
        '',
        ...blocks,
        '═══════════════════════════════',
        'INSTRUCCIONES',
        '═══════════════════════════════',
        '1. Copia cada tweet en orden en X',
        '2. Usa "Agregar al hilo" para conectarlos',
        '3. Publica el tweet [1] primero',
        '═══════════════════════════════',
        'Generado con social.noctra.studio',
      ].join('\n')
    )

    return
  }

  downloadTextFile(
    `x-tweet-${date}.txt`,
    [
      '═══════════════════════════════',
      `TWEET PARA X - ${date}`,
      '═══════════════════════════════',
      readString(content.tweet),
      '',
      `(${String(content.char_count ?? '')} caracteres)`,
    ].join('\n')
  )
}

export function supportsZipExport(platform: Platform) {
  return platform === 'instagram' || platform === 'linkedin'
}

export function getLinkedInSlideCount(content: Record<string, unknown>) {
  return readLinkedInSlides(content.slides).length
}
