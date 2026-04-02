import { NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { withUserInputLanguageRule } from '@/lib/ai/language-rule'
import { getUser } from '@/lib/auth/get-user'
import type { Platform } from '@/lib/product'
import { parseAnthropicJson } from '@/lib/social-server'
import {
  inferPostFormat,
  isRecord,
  readOptionalString,
  readString,
  readXThreadTweets,
  type PostFormat,
  type XThreadTweet,
} from '@/lib/social-content'

type EnhanceWritingBody = {
  angle?: string
  content?: Record<string, unknown>
  format?: PostFormat
  pillar?: string
  platform?: Platform
}

type EnhanceResponse = {
  content?: Record<string, unknown>
  error?: string
}

function getPlatformSystemPrompt(platform: Platform) {
  const sharedRules = `REGLAS UNIVERSALES:
- Nunca cambies el argumento central, el ángulo, ni los datos factuales.
- Nunca agregues información nueva que no esté en el original.
- Elimina redundancias, muletillas débiles ("un poco", "tal vez", "básicamente") y voz pasiva cuando sea posible.
- Devuelve solo el contenido mejorado en el formato solicitado. Sin prefacios ni explicaciones.`

  if (platform === 'x') {
    return withUserInputLanguageRule(`Eres editor senior de X en español LATAM.

Objetivo:
- Mejorar el hook, el ritmo de frases y la tensión de apertura.
- Quitar relleno y volver la escritura más directa y filosa.
- Tono: directo, seguro, con criterio propio de alguien que ejecuta.
- No agregues hashtags ni emojis si no existen ya.
- Si es un post individual, debe seguir por debajo de 280 caracteres.

${sharedRules}`)
  }

  if (platform === 'instagram') {
    return withUserInputLanguageRule(`Eres editor senior de Instagram en español LATAM.

Objetivo:
- Hacer más potente el titular visual.
- Mejorar la estructura del cuerpo para que se escanee fácil.
- Dar al caption un arco claro: hook -> insight -> CTA.
- Tono: educativo pero humano, con autoridad conversacional.
- Los hashtags se preservan fuera de esta tarea. No los modifiques.

${sharedRules}`)
  }

  return withUserInputLanguageRule(`Eres editor senior de LinkedIn en español LATAM.

Objetivo:
- Convertir la primera línea en un scroll-stopper.
- Mantener párrafos de máximo 2 líneas cuando corresponda.
- Fortalecer el arco problema -> insight -> implicación -> pregunta/CTA.
- Tono: profesional con criterio, sin jerga corporativa ni informalidad excesiva.
- Preserva saltos de línea, viñetas y estructura existentes cuando estén presentes.

${sharedRules}`)
}

function getPillarLabel(pillar: string | undefined) {
  const normalized = pillar?.trim()
  return normalized ? normalized : 'Sin pilar específico'
}

function getEnhancementPrompt(params: {
  angle: string
  content: Record<string, unknown>
  format: PostFormat
  pillar: string
  platform: Platform
}) {
  const { angle, content, format, pillar, platform } = params

  if (platform === 'instagram' && format === 'single') {
    return `Plataforma: instagram
Formato: single
Ángulo: ${angle}
Pilar: ${pillar}

TEXTO ORIGINAL:
Titular Social:
${readString(content.headline)}

Cuerpo del Post:
${readString(content.body || content.caption)}

Caption:
${readString(content.caption)}

TAREA:
- Mejora el titular social para que sea más punchy y emocional.
- Mejora el cuerpo para que tenga más claridad y cadencia visual.
- Mejora el caption manteniendo el arco hook -> insight -> CTA.
- Conserva el significado exacto.

Devuelve solo JSON válido:
{
  "headline": "string",
  "body": "string",
  "caption": "string"
}`
  }

  if (platform === 'instagram') {
    return `Plataforma: instagram
Formato: ${format}
Ángulo: ${angle}
Pilar: ${pillar}

Caption original:
${readString(content.caption)}

TAREA:
- Mejora únicamente el caption.
- Haz más fuerte la apertura y más clara la progresión hacia el CTA.
- No cambies hashtags ni estructura fuera del caption.

Devuelve solo JSON válido:
{
  "caption": "string"
}`
  }

  if (platform === 'x' && format === 'tweet') {
    return `Plataforma: x
Formato: tweet
Ángulo: ${angle}
Pilar: ${pillar}

Tweet original:
${readString(content.tweet) || readString(content.caption)}

TAREA:
- Mejora hook, ritmo y tensión.
- Mantén el tweet debajo de 280 caracteres.

Devuelve solo JSON válido:
{
  "tweet": "string",
  "char_count": 123
}`
  }

  if (platform === 'x' && format === 'thread') {
    const tweets = readXThreadTweets(content.tweets ?? content.thread)
      .map((tweet) => `Tweet ${tweet.number}:\n${tweet.content}`)
      .join('\n\n')

    return `Plataforma: x
Formato: thread
Ángulo: ${angle}
Pilar: ${pillar}

Thread original:
${tweets}

TAREA:
- Mejora cada tweet sin cambiar el argumento global del hilo.
- Conserva el mismo número de tweets.
- Mantén cada tweet por debajo de 280 caracteres.
- Respeta el orden narrativo actual.

Devuelve solo JSON válido:
{
  "tweets": [
    { "number": 1, "content": "string" }
  ]
}`
  }

  if (platform === 'x' && format === 'article') {
    return `Plataforma: x
Formato: article
Ángulo: ${angle}
Pilar: ${pillar}

Título:
${readString(content.title)}

Subtítulo:
${readString(content.subtitle)}

Cuerpo:
${readString(content.body)}

TAREA:
- Mejora la fuerza del título y la claridad del cuerpo.
- Mantén la estructura general y el mensaje intactos.

Devuelve solo JSON válido:
{
  "title": "string",
  "subtitle": "string",
  "body": "string"
}`
  }

  if (platform === 'linkedin' && (format === 'document' || format === 'carousel')) {
    return `Plataforma: linkedin
Formato: ${format}
Ángulo: ${angle}
Pilar: ${pillar}

Caption original:
${readString(content.post_caption)}

TAREA:
- Mejora solo el caption del post.
- La primera línea debe sostenerse sola.
- Respeta saltos de línea y bullets si existen.

Devuelve solo JSON válido:
{
  "post_caption": "string"
}`
  }

  return `Plataforma: linkedin
Formato: ${format}
Ángulo: ${angle}
Pilar: ${pillar}

Texto original:
${readString(content.caption)}

TAREA:
- Mejora el opening hook.
- Conserva los saltos de línea y la estructura existente.
- Refuerza el arco problema -> insight -> implicación -> CTA/pregunta.

Devuelve solo JSON válido:
{
  "caption": "string"
}`
}

function mergeThreadTweets(
  originalTweets: XThreadTweet[],
  improvedTweets: Array<{ content?: unknown; number?: unknown }>
) {
  return originalTweets.map((tweet) => {
    const updated = improvedTweets.find((item) => Number(item.number) === tweet.number)
    const content = readString(updated?.content).trim()

    return content
      ? {
          ...tweet,
          char_count: content.length,
          content,
        }
      : tweet
  })
}

function mergeEnhancedContent(
  platform: Platform,
  format: PostFormat,
  originalContent: Record<string, unknown>,
  improvedContent: Record<string, unknown>
) {
  if (platform === 'instagram' && format === 'single') {
    return {
      ...originalContent,
      body: readString(improvedContent.body) || readString(originalContent.body || originalContent.caption),
      caption: readString(improvedContent.caption) || readString(originalContent.caption),
      headline: readString(improvedContent.headline) || readString(originalContent.headline),
    }
  }

  if (platform === 'instagram') {
    return {
      ...originalContent,
      caption: readString(improvedContent.caption) || readString(originalContent.caption),
    }
  }

  if (platform === 'x' && format === 'tweet') {
    const tweet = readString(improvedContent.tweet) || readString(originalContent.tweet) || readString(originalContent.caption)

    return {
      ...originalContent,
      char_count: tweet.length,
      tweet,
    }
  }

  if (platform === 'x' && format === 'thread') {
    const originalTweets = readXThreadTweets(originalContent.tweets ?? originalContent.thread)
    const improvedTweets = Array.isArray(improvedContent.tweets)
      ? (improvedContent.tweets as Array<{ content?: unknown; number?: unknown }>)
      : []
    const tweets = mergeThreadTweets(originalTweets, improvedTweets)

    return {
      ...originalContent,
      thread: tweets,
      tweets,
    }
  }

  if (platform === 'x' && format === 'article') {
    return {
      ...originalContent,
      body: readString(improvedContent.body) || readString(originalContent.body),
      subtitle:
        readOptionalString(improvedContent.subtitle) ??
        readOptionalString(originalContent.subtitle) ??
        '',
      title: readString(improvedContent.title) || readString(originalContent.title),
    }
  }

  if (platform === 'linkedin' && (format === 'document' || format === 'carousel')) {
    return {
      ...originalContent,
      post_caption:
        readString(improvedContent.post_caption) || readString(originalContent.post_caption),
    }
  }

  return {
    ...originalContent,
    caption: readString(improvedContent.caption) || readString(originalContent.caption),
  }
}

export async function POST(req: Request) {
  try {
    try {
      await getUser()
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as EnhanceWritingBody
    const platform = body.platform
    const content = isRecord(body.content) ? body.content : null
    const angle = body.angle?.trim()

    if (!platform || !content || !angle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const format = body.format ?? inferPostFormat(platform, content)
    const pillar = getPillarLabel(body.pillar)
    const system = getPlatformSystemPrompt(platform)
    const prompt = getEnhancementPrompt({
      angle,
      content,
      format,
      pillar,
      platform,
    })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1600,
      system,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const improved = parseAnthropicJson<EnhanceResponse>(message)
    const improvedContent = isRecord(improved.content)
      ? improved.content
      : (improved as Record<string, unknown>)
    const mergedContent = mergeEnhancedContent(platform, format, content, improvedContent)

    return NextResponse.json({
      content: mergedContent,
      format,
      platform,
    })
  } catch (error: unknown) {
    console.error('Error enhancing writing:', error)
    const message = error instanceof Error ? error.message : 'Failed to enhance writing'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
