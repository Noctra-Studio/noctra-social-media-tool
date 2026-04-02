import { NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { getUser } from '@/lib/auth/get-user'
import { withUserInputLanguageRule } from '@/lib/ai/language-rule'
import { parseAnthropicJson } from '@/lib/social-server'
import {
  getCaptionText,
  inferPostFormat,
  isRecord,
  type PostFormat,
} from '@/lib/social-content'
import type { Platform } from '@/lib/product'
import type { EditorialFunctionKey } from '@/lib/content-score'

type RebalanceBody = {
  angle?: string
  content?: Record<string, unknown>
  format?: PostFormat
  platform?: Platform
  post_id?: string
  weak_dimension?: EditorialFunctionKey
  rebalance_tip?: string
  strong_dimensions?: EditorialFunctionKey[] // dimensiones a preservar
}

export async function POST(req: Request) {
  try {
    let user
    try {
      user = await getUser()
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as RebalanceBody
    const platform = body.platform
    const angle = body.angle?.trim()
    const content = isRecord(body.content) ? body.content : null

    if (!platform || !angle || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const format = body.format ?? inferPostFormat(platform, content)
    const caption = getCaptionText(platform, format, content).trim()

    if (!caption) {
      return NextResponse.json(
        { error: 'No caption text to rebalance' },
        { status: 400 }
      )
    }

    const weakDimension = body.weak_dimension ?? 'conocimiento'
    const rebalanceTip = body.rebalance_tip ?? ''
    const strongDimensions = body.strong_dimensions ?? []

    const dimensionLabels: Record<EditorialFunctionKey, string> = {
      educa: 'Educa',
      curiosidad: 'Genera curiosidad',
      conocimiento: 'Demuestra conocimiento',
      convence: 'Convence',
    }

    const weakLabel = dimensionLabels[weakDimension]
    const strongLabels = strongDimensions
      .map(d => dimensionLabels[d])
      .join(', ')

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      system: withUserInputLanguageRule(`Eres un editor de contenido para
redes sociales especializado en marketing B2B para agencias tecnológicas
en LATAM.

Tu única tarea: mejorar un aspecto específico de un post existente sin
alterar su estructura, voz, ángulo, ni sus puntos fuertes.

REGLA PRINCIPAL: Edición mínima, máximo impacto.
- Solo modifica las frases o secciones que afectan la dimensión débil.
- Preserva intactas las secciones que ya funcionan bien.
- El resultado debe sonar como el mismo autor, no como una reescritura.
- Si el post tiene un buen hook, el hook no cambia.
- Si el CTA es efectivo, el CTA no cambia.

Output: SOLO JSON válido con el campo correcto según plataforma/formato.`),
      messages: [
        {
          role: 'user',
          content: `Plataforma: ${platform}
Ángulo: ${angle}
Formato: ${format}

POST ORIGINAL:
---
${caption}
---

DIAGNÓSTICO:
- Dimensión DÉBIL que necesita mejora: ${weakLabel}
- Instrucción específica: ${rebalanceTip}
${strongDimensions.length > 0 ? `- Dimensiones FUERTES que NO deben cambiar: ${strongLabels}` : ''}

TAREA:
Modifica el post para fortalecer "${weakLabel}" siguiendo la instrucción.
No reescribas todo — solo edita las partes que afectan esa dimensión.
Mantén exactamente el mismo tono, la misma estructura y los puntos fuertes.

Devuelve el post mejorado en el mismo formato JSON que el original.
Si el formato es tweet: { "tweet": "string", "char_count": number }
Si es thread: { "tweets": [...misma estructura...] }
Si es caption de instagram/linkedin: { "caption": "string", "hashtags": [...] }
Si es article: { "title": "string", "subtitle": "string", "body": "string" }

Solo devuelve JSON, sin explicaciones.`,
        },
      ],
    })

    const rebalanced = parseAnthropicJson<Record<string, unknown>>(message)

    // Merge: mantiene el content original y sobreescribe solo los campos
    // que cambió el modelo, preservando metadata como slides, etc.
    const mergedContent = { ...content, ...rebalanced }

    return NextResponse.json({
      content: mergedContent,
      platform,
      format,
    })
  } catch (error: unknown) {
    console.error('Error rebalancing content:', error)
    const msg = error instanceof Error ? error.message : 'Failed to rebalance'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
