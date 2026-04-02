import { NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { getUser } from '@/lib/auth/get-user'
import type { Platform } from '@/lib/product'
import { parseAnthropicJson } from '@/lib/social-server'

type HookVariantsBody = {
  angle?: string
  brand_voice?: Record<string, unknown>
  hook?: string
  platform?: Platform
}

type HookVariant = {
  pattern: 'pregunta' | 'stat' | 'contrarian'
  text: string
  why: string
}

type HookVariantsResponse = {
  variants?: HookVariant[]
}

export async function POST(req: Request) {
  try {
    try {
      await getUser()
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as HookVariantsBody
    const hook = body.hook?.trim()
    const platform = body.platform
    const angle = body.angle?.trim()

    if (!hook || !platform || !angle) {
      return NextResponse.json({ error: 'Missing hook, platform, or angle' }, { status: 400 })
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 900,
      system: 'Eres experto en hooks para redes sociales en español LATAM.\nGenera variantes de primera línea. Output ONLY JSON válido.',
      messages: [
        {
          role: 'user',
          content: `Hook actual para ${platform} con ángulo ${angle}:
'${hook}'

Genera 3 variantes alternativas que generen más curiosidad o impacto.
Cada una debe usar un patrón diferente: pregunta, stat/dato, contrarian.

Devuelve ONLY:
{
  "variants": [
    {
      "text": "string (max 120 chars)",
      "pattern": "pregunta" | "stat" | "contrarian",
      "why": "string (max 10 palabras por qué funciona)"
    }
  ]
}`,
        },
      ],
    })

    const parsed = parseAnthropicJson<HookVariantsResponse>(message)

    return NextResponse.json({
      variants: Array.isArray(parsed.variants) ? parsed.variants.slice(0, 3) : [],
    })
  } catch (error: unknown) {
    console.error('Error generating hook variants:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate hook variants'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
