import { Anthropic } from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"
import { requireRouteUser } from '@/lib/auth/require-route-user'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { response } = await requireRouteUser()

    if (response) {
      return response
    }

    const { platform, content, angle } = await req.json()

    const systemPrompt = `Eres un experto Estratega de Redes Sociales especializado en crecimiento orgánico y SEO.
Tu tarea es generar los hashtags más efectivos para fortalecer una publicación en ${platform}.

REGLAS:
- Genera entre 10 y 15 hashtags.
- Mezcla hashtags de alto volumen (genéricos) con específicos (nicho).
- Los hashtags deben estar en el idioma del contenido (principalmente español).
- No incluyas el símbolo # en el array de respuesta, solo las palabras.
- Formato de respuesta: Solo un JSON con un campo "hashtags" que sea un array de strings.

ESTILO:
- Enfocado en "Premium Noctra": Minimalista, profesional, tecnológico, estratégico.`

    const userPrompt = `Contenido de la publicación:
${JSON.stringify(content, null, 2)}

Ángulo/Tono: ${angle}

Genera los hashtags ideales para esta publicación en ${platform}.`

    const anthropicResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    })

    const text = anthropicResponse.content[0].type === 'text' ? anthropicResponse.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { hashtags: [] }

    // Ensure hashtags have # prefix if not present (the frontend TagsEditor handles this too but let's be safe)
    const hashtags = (data.hashtags || []).map((tag: string) => 
      tag.startsWith('#') ? tag : `#${tag}`
    )

    return NextResponse.json({ hashtags })
  } catch (error) {
    console.error("Error suggesting hashtags:", error)
    return NextResponse.json(
      { error: "Error al generar sugerencias" },
      { status: 500 }
    )
  }
}
