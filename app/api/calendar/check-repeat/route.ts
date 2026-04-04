import { NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { requireRouteUser } from '@/lib/auth/require-route-user'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { response, user } = await requireRouteUser()

    if (response) {
      return response
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const { idea } = await req.json()

    if (!idea) {
      return NextResponse.json({ error: 'Missing idea' }, { status: 400 })
    }

    // Fetch last 30 posts
    const { data: recentPosts, error } = await supabase
      .from('posts')
      .select('id, angle, content, platform, scheduled_at')
      .eq('user_id', user.id)
      .neq('status', 'draft')
      .order('scheduled_at', { ascending: false })
      .limit(30)

    if (error) throw error

    if (!recentPosts || recentPosts.length === 0) {
      return NextResponse.json({ is_repeat: false })
    }

    const postsSummary = recentPosts.map(p => 
      `ID: ${p.id} | Platform: ${p.platform} | Angle: ${p.angle} | Content Extract: ${JSON.stringify(p.content).substring(0, 100)}`
    ).join('\n')

    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      temperature: 0.1,
      system: "Eres un estratega editorial experto. Tu tarea es detectar si una nueva idea de post repite un ángulo o gancho ya cubierto recientemente. Responde EXCLUSIVAMENTE con un JSON: { \"is_repeat\": boolean, \"similar_post_id\"?: string, \"similarity_reason\"?: string }. \n\nREGLAS CRÍTICAS:\n1. El 'similarity_reason' debe ser una breve explicación conversacional en ESPAÑOL resaltando el ángulo que se repite (ej. 'Este post usa el mismo ejemplo de ChatGPT que el del martes').\n2. PROHIBIDO incluir IDs técnicos, UUIDs o terminología de base de datos en la razón.\n3. Si no hay repetición clara, is_repeat es false.",
      messages: [
        { role: "user", content: `Nueva idea: ${idea}\n\nPosts recientes: \n${postsSummary}` }
      ]
    })

    const textContent = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const cleanJson = textContent.replace(/```json/g, '').replace(/```/g, '').trim()
    
    const parsed = JSON.parse(cleanJson)

    return NextResponse.json(parsed)

  } catch (error: unknown) {
    console.error('Error checking repeat:', error)
    // On failure we just assume it's not a repeat to not block the user
    return NextResponse.json({ is_repeat: false })
  }
}
