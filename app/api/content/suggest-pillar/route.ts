import { NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { isMissingStrategyTablesError } from '@/lib/brand-strategy'
import { getUser } from '@/lib/auth/get-user'
import { parseAnthropicJson } from '@/lib/social-server'
import { createClient } from '@/lib/supabase/server'

type SuggestPillarBody = {
  idea?: string
}

type SuggestPillarResponse = {
  confidence: 'high' | 'low' | 'medium'
  pillar_id: string | null
  reason: string
}

export async function POST(req: Request) {
  try {
    const user = await getUser()
    const body = (await req.json()) as SuggestPillarBody
    const idea = body.idea?.trim()

    if (!idea) {
      return NextResponse.json({ error: 'Missing idea' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: pillars, error } = await supabase
      .from('brand_pillars')
      .select('id, name, description, sort_order')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })

    if (error) {
      if (isMissingStrategyTablesError(error)) {
        return NextResponse.json({
          confidence: 'low',
          pillar_id: null,
          reason: 'La capa de estrategia aún no está disponible en la base.',
        } satisfies SuggestPillarResponse)
      }

      throw error
    }

    if (!pillars || pillars.length === 0) {
      return NextResponse.json({
        confidence: 'low',
        pillar_id: null,
        reason: 'No hay pilares configurados todavía.',
      } satisfies SuggestPillarResponse)
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: `Clasifica ideas editoriales contra pilares de contenido.
Devuelve solo JSON válido.
Si nada encaja claramente, usa pillar_id = null.`,
      messages: [
        {
          role: 'user',
          content: `Idea:
${idea}

Pilares disponibles:
${pillars
  .map((pillar) => `- ${pillar.id}: ${pillar.name} :: ${pillar.description || 'Sin descripción'}`)
  .join('\n')}

Devuelve:
{
  "pillar_id": "uuid o null",
  "confidence": "high | medium | low",
  "reason": "explicación breve en español"
}`,
        },
      ],
    })

    const parsed = parseAnthropicJson<SuggestPillarResponse>(message)
    const validPillar = pillars.some((pillar) => pillar.id === parsed.pillar_id)

    return NextResponse.json({
      confidence: parsed.confidence || 'low',
      pillar_id: validPillar ? parsed.pillar_id : null,
      reason: parsed.reason || 'Sin sugerencia clara.',
    } satisfies SuggestPillarResponse)
  } catch (error) {
    console.error('Suggest pillar error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to suggest pillar' },
      { status: 500 }
    )
  }
}
