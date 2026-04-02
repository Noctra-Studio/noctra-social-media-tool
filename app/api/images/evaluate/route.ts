import { getUser } from '@/lib/auth/get-user'
import { anthropic } from '@/lib/anthropic'
import { parseAnthropicJson } from '@/lib/social-server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { EfficacyReport } from '@/lib/social-content'

export async function POST(req: Request) {
  try {
    const user = await getUser()
    const supabase = await createClient()
    const { image, post_content, brief, platform } = await req.json()

    if (!image || !post_content) {
      return NextResponse.json({ error: 'Missing image or post content' }, { status: 400 })
    }

    const { caption, angle } = post_content
    const { scores, verdict: geminiVerdict } = image

    const systemPrompt = `You are evaluating the final pairing of a post and its selected image for maximum social media impact.
   
   POST:
   Platform: ${platform}
   Caption: ${caption}
   Angle: ${angle}
   
   SELECTED IMAGE:
   Description from AI: ${geminiVerdict}
   Scores — Mood: ${scores.mood}, Composition: ${scores.composition},
   Color: ${scores.color}, Subject: ${scores.subject}
   Overall: ${scores.total}
   
   VISUAL BRIEF:
   Ideal: ${brief.ideal_image_description}
   Avoid: ${brief.visual_brief.avoid.join(', ')}
   
   Evaluate this specific post + image combination.
   
   Think about:
   1. Does the image complement or compete with the text?
   2. Will a reader's eye flow naturally from image to text?
   3. Does the emotional tone align with the content's goal?
   4. For ${platform}: does this combination stop the scroll?
   5. Any specific risks (text readability, cultural context)?
   
   Respond ONLY with JSON:
   {
     "efficacy_score": number,    // 0-10
     "grade": "A+" | "A" | "B" | "C" | "D",
     "verdict": "string",
     "strengths": ["string"],
     "risks": ["string"],
     "optimization_tips": [
       {
         "tip": "string",
         "type": "text" | "overlay" | "crop" | "color" | "placement"
       }
     ],
     "alternative_suggestion": {
       "should_reconsider": boolean,
       "reason": "string" | null,
       "better_query": "string" | null
     }
   }`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Evaluate this combination.' }],
    })

    const evaluation = parseAnthropicJson<EfficacyReport>(message)

    // Log tokens
    await supabase.from('token_ledger').insert({
      user_id: user.id,
      operation: 'image_evaluate',
      tokens_used: 800,
      metadata: { unsplash_id: image.unsplashId }
    })

    return NextResponse.json(evaluation)

  } catch (error: any) {
    console.error('Error evaluating combination:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
