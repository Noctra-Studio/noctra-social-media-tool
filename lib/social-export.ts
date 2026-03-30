import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import type { Platform } from '@/lib/product'
import {
  ensureHashtags,
  formatExportDate,
  joinHashtags,
  plainTextFromMarkdown,
  readInstagramAudioSuggestions,
  readInstagramSlides,
  readLinkedInSlides,
  readString,
  readStringArray,
  readXThreadTweets,
  type PostFormat,
} from '@/lib/social-content'

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
  const audioSuggestions = readInstagramAudioSuggestions(exportMetadata?.audio_suggestions)

  const captionSections = [caption]

  if (hashtags.length > 0) {
    captionSections.push('---', `Hashtags: ${joinHashtags(hashtags)}`)
  }

  if (audioSuggestions.length > 0) {
    captionSections.push(
      '---',
      'Audio sugerido:',
      ...audioSuggestions.map(
        (suggestion, index) =>
          `${index + 1}. ${suggestion.style} - buscar "${suggestion.search_query}" en Instagram`
      )
    )
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
      slidesFolder.file(
        `slide-${indexLabel}-${slide.type}.txt`,
        [
          `TITULAR: ${slide.headline}`,
          `CUERPO: ${slide.body}`,
          `IMAGEN SUGERIDA: ${slide.visual_direction}`,
          `NOTA DE DISENO: ${slide.design_note}`,
        ].join('\n')
      )
    })

    root.file(
      'guia-rapida.txt',
      [
        'Instrucciones breves:',
        '1. Disena cada slide en Canva usando el titular y cuerpo',
        '2. Busca la imagen sugerida en Unsplash o usa la de la app',
        '3. Sube los slides en orden al carrusel de Instagram',
        '4. Copia el caption.txt en la descripcion',
        '5. Busca el audio sugerido en la biblioteca de Instagram',
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
      ].join('\n')
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
