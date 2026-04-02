import { getUser } from '@/lib/auth/get-user'
import { anthropic } from '@/lib/anthropic'
import { parseAnthropicJson, formatBrandVoice } from '@/lib/social-server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { VisualBrief } from '@/lib/social-content'

export async function POST(req: Request) {
  try {
    const user = await getUser()
    const supabase = await createClient()
    const { post_content, slide_index, slide_type, brand_voice, post_id, feedback } = await req.json()

    if (!post_content || !post_content.caption) {
      return NextResponse.json({ error: 'Missing post content' }, { status: 400 })
    }

    // Check if brief already exists in cache (Supabase) - ONLY if no refinement feedback is provided
    if (post_id && !feedback) {
      const { data: existingBrief } = await supabase
        .from('image_briefs')
        .select('brief_data')
        .eq('post_id', post_id)
        .eq('slide_index', slide_index ?? -1)
        .maybeSingle()

      if (existingBrief) {
        return NextResponse.json(existingBrief.brief_data as VisualBrief)
      }
    }

    const { caption, platform, angle, audience_description } = post_content
    const formattedBrandVoice = formatBrandVoice(brand_voice)

    const systemPrompt = `You are a creative director specialized in social media visual strategy for Latin American brands.
   
   Analyze this social media post and generate a precise visual brief for finding the perfect image on Unsplash.
   
   Brand voice context: ${formattedBrandVoice}
   Platform: ${platform}
   Content angle: ${angle}
   ${slide_type ? `Slide type: ${slide_type}` : ''}
   ${audience_description ? `Audience: ${audience_description}` : ''}
   
   Post content:
   ${caption}
   
   ${feedback ? `REFINEMENT REQUEST FROM USER:
    "${feedback}"
    Please adjust the visual brief and search queries to accommodate this specific feedback while maintaining alignment with the post content.` : ''}
    
    Generate a visual brief with maximum precision.
    
    IMPORTANT: 
    - The "queries" field is for Unsplash search. Use 2-4 visual keywords (e.g., "minimal architecture ocean"). 
    - The "topic_keywords" field is for general topic identification. Provide exactly 5 keywords in Spanish (e.g., "Finanzas", "Minimalismo", "Oficina", "Tecnología", "Crecimiento").
    
    Respond ONLY with valid JSON — no preamble, no markdown:
    {
      "queries": [
        {
          "query": "string",
          "rationale": "string",
          "priority": 1
        }
      ],
     "topic_keywords": ["string", "string", "string", "string", "string"],
     "visual_brief": {
       "mood": "string",
       "composition": "string",
       "color_palette": "string",
       "subject_matter": "string",
       "lighting": "string",
       "avoid": ["string"]
     },
     "mood_category_id": "string",
     "ideal_image_description": "string",
     "why_it_works": "string",
     "per_slide_notes": "string"
   }`

    let message: import('@anthropic-ai/sdk/resources').Message | undefined
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        message = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1200,
          system: systemPrompt,
          messages: [{ role: 'user', content: 'Generate the visual brief for this post.' }],
        })
        break
      } catch (err: any) {
        if (err?.status === 429 && attempt < 2) {
          const retryAfter = parseInt(err?.headers?.['retry-after'] ?? '10', 10)
          await new Promise(r => setTimeout(r, retryAfter * 1000))
          continue
        }
        throw err
      }
    }

    if (!message) throw new Error('Failed to get response from Anthropic')

    // Use parseAnthropicJson but fall back to raw JSON extraction if it fails
    let brief: VisualBrief
    try {
      brief = parseAnthropicJson<VisualBrief>(message)
    } catch {
      // Model added preamble — extract the JSON object directly
      const raw = message.content
        .filter((b): b is import('@anthropic-ai/sdk/resources').TextBlock => b.type === 'text')
        .map(b => b.text)
        .join('')
      const start = raw.indexOf('{')
      const end = raw.lastIndexOf('}')
      if (start === -1 || end === -1) throw new Error('Anthropic did not return a JSON object')
      brief = JSON.parse(raw.slice(start, end + 1)) as VisualBrief
    }

    // Log token usage
    await supabase.from('token_ledger').insert({
      user_id: user.id,
      operation: 'image_brief',
      tokens_used: 500, // Approximate for Haiku
      metadata: { post_id, slide_index }
    })

    // Store in cache if post_id provided (Overwrite if it's a refinement)
    if (post_id) {
      await supabase.from('image_briefs').upsert({
        user_id: user.id,
        post_id: post_id,
        slide_index: slide_index ?? -1,
        brief_data: brief
      })
    }

    return NextResponse.json(brief)

  } catch (error: any) {
    console.error('Error generating visual brief:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
