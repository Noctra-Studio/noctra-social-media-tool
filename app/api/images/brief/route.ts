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
   Think like a creative director who needs to brief a photo researcher. Be specific about:
   - What emotion the image should trigger
   - What compositional style works for this text
   - What colors will complement or contrast the content
   - What to absolutely avoid
   
   Respond ONLY with valid JSON — no preamble, no markdown:
   {
     "queries": [
       {
         "query": "string",
         "rationale": "string",
         "priority": 1
       }
     ],
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

    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Generate the visual brief for this post.' }],
    })

    const brief = parseAnthropicJson<VisualBrief>(message)

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
