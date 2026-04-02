import { NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { getUser } from '@/lib/auth/get-user'
import {
  normalizeEditorialScoreData,
  type EditorialScoreData,
} from '@/lib/content-score'
import type { Platform } from '@/lib/product'
import { parseAnthropicJson } from '@/lib/social-server'
import {
  getCaptionText,
  inferPostFormat,
  isRecord,
  type PostFormat,
} from '@/lib/social-content'
import { createClient } from '@/lib/supabase/server'

type ScoreBody = {
  angle?: string
  content?: Record<string, unknown>
  format?: PostFormat
  platform?: Platform
  post_id?: string
}

function isMissingScoreDataColumnError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false
  }

  return 'code' in error && (error as { code?: string }).code === '42703'
}

async function saveScoreData(params: {
  postId: string
  score: EditorialScoreData
  userId: string
}) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('posts')
    .update({ score_data: params.score })
    .eq('id', params.postId)
    .eq('user_id', params.userId)
    .select('id')
    .maybeSingle()

  if (error) {
    if (isMissingScoreDataColumnError(error)) {
      return null
    }

    console.error('Failed to persist score_data:', error)
    return null
  }

  return data?.id ?? null
}

export async function POST(req: Request) {
  try {
    let user

    try {
      user = await getUser()
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as ScoreBody
    const platform = body.platform
    const angle = body.angle?.trim()
    const content = isRecord(body.content) ? body.content : null

    if (!platform || !angle || !content) {
      return NextResponse.json(
        { error: 'Missing platform, content, or angle' },
        { status: 400 }
      )
    }

    const format = body.format ?? inferPostFormat(platform, content)
    const caption = getCaptionText(platform, format, content).trim()

    if (!caption) {
      return NextResponse.json({ error: 'No caption text available to score' }, { status: 400 })
    }

    const PLATFORM_SCORING_CALIBRATION: Record<string, string> = {
      x: `
CALIBRACIÓN PARA X (Twitter):
Un tweet o thread con score 90-100 en cada dimensión cumple esto:
- Educa (90+): Enseña algo accionable que el lector puede aplicar HOY.
  Incluye al menos un insight no obvio o un marco mental concreto.
- Curiosidad (90+): El hook genera tensión inmediata. El lector no puede
  ignorarlo porque contradice algo que cree o promete algo específico.
- Conocimiento (90+): Cita números reales, procesos propios, o experiencia
  de primera mano. No habla en abstracto.
- Convence (90+): El lector termina queriendo hacer algo diferente.
  Hay un CTA implícito o explícito que no suena a venta.

Un tweet con score 70 en Educa tiene información útil pero genérica,
sin aplicación inmediata. Un 50 en Curiosidad es un hook que no detiene
el scroll. Calibra con esta escala, no con miedo a dar 90+.`,

      instagram: `
CALIBRACIÓN PARA INSTAGRAM:
Un post con score 90-100 cumple:
- Educa (90+): La primera línea del caption ya enseña algo. El resto
  desarrolla con ejemplos visuales o pasos claros.
- Curiosidad (90+): El caption tiene una apertura que obliga a hacer
  clic en "ver más". Hay tensión o pregunta sin resolver hasta el final.
- Conocimiento (90+): Menciona resultados específicos, procesos propios,
  o un punto de vista diferenciado del sector.
- Convence (90+): El CTA es natural y bajo en fricción. Invita a
  interacción sin presionar a comprar.

Un 70 en cualquier dimensión significa que cumple parcialmente pero le
falta especificidad o le sobra generalidad.`,

      linkedin: `
CALIBRACIÓN PARA LINKEDIN:
Un post con score 90-100 cumple:
- Educa (90+): Enseña un marco, proceso o perspectiva que el lector
  puede aplicar a su negocio esta semana.
- Curiosidad (90+): La primera línea visible (antes del "ver más") es
  tan específica y relevante que el lector de B2B LATAM hace clic.
- Conocimiento (90+): Demuestra experiencia ejecutando, no teorizando.
  Hay evidencia: números, cliente, proyecto, decisión real.
- Convence (90+): El lector termina el post con una perspectiva cambiada
  o una acción clara. No es motivacional vacío.`,
    }

    const calibration = PLATFORM_SCORING_CALIBRATION[platform] ??
      PLATFORM_SCORING_CALIBRATION.linkedin

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 900,
      system: `Eres un evaluador de contenido editorial especializado en
marketing B2B para agencias tecnológicas en América Latina.

Tu tarea: evaluar contenido de redes sociales en 4 dimensiones con
precisión real. No infles scores, no los bajes por prudencia. Usa la
escala completa 0-100.

${calibration}

REGLA CRÍTICA DE HONESTIDAD:
- Si el contenido es realmente bueno en una dimensión, dale 85-95.
  No tengas miedo de puntuar alto cuando está justificado.
- Si es mediocre, dale 50-65. No des 70 por default.
- El overall NO es el promedio simple — es tu evaluación de efectividad
  total del post para conseguir su objetivo en ${platform}.
- Un post puede tener overall 88 si 3 dimensiones son fuertes aunque
  una sea débil.

Responde SOLO JSON válido, sin markdown, sin explicaciones.`,
      messages: [
        {
          role: 'user',
          content: `Plataforma: ${platform}
Ángulo del contenido: ${angle}

CONTENIDO A EVALUAR:
---
${caption}
---

Evalúa con honestidad. Si el hook es fuerte, curiosidad puede ser 88.
Si el contenido enseña algo útil y específico, educa puede ser 90.
Usa la escala completa.

Devuelve EXACTAMENTE este JSON:
{
  "educa": { "score": number, "note": "max 12 palabras explicando el score" },
  "curiosidad": { "score": number, "note": "max 12 palabras" },
  "conocimiento": { "score": number, "note": "max 12 palabras" },
  "convence": { "score": number, "note": "max 12 palabras" },
  "dominant": "educa" | "curiosidad" | "conocimiento" | "convence",
  "weak": "educa" | "curiosidad" | "conocimiento" | "convence" | null,
  "rebalance_tip": "instrucción específica de max 20 palabras para fortalecer solo la dimensión más débil",
  "overall": number
}`,
        },
      ],
    })

    const score = normalizeEditorialScoreData(parseAnthropicJson(message))

    const postId = body.post_id?.trim()

    if (!postId) {
      return NextResponse.json(score)
    }

    const savedPostId = await saveScoreData({
      postId,
      score,
      userId: user.id,
    })

    return NextResponse.json(savedPostId ? { ...score, post_id: savedPostId } : score)
  } catch (error: unknown) {
    console.error('Error scoring content:', error)
    const message = error instanceof Error ? error.message : 'Failed to score content'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
