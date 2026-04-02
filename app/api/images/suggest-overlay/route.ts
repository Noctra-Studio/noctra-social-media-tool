import { getUser } from '@/lib/auth/get-user'
import { anthropic } from '@/lib/anthropic'
import { parseAnthropicJson } from '@/lib/social-server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { OverlayConfig } from '@/components/compose/image-drawer'

export async function POST(req: Request) {
  try {
    const user = await getUser()
    const supabase = await createClient()
    const { image, post_content, platform } = await req.json()

    if (!image || !post_content) {
      return NextResponse.json({ error: 'Missing image or post content' }, { status: 400 })
    }

    const { caption, angle } = post_content
    const { scores, verdict: imageDescription } = image

    const systemPrompt = `You are a professional visual designer optimizing social media content.
    Your task is to suggest the perfect text overlay configuration for an image to ensure maximum impact and readability.
    
    POST CONTEXT:
    Platform: ${platform}
    Caption: ${caption}
    Angle: ${angle}
    
    IMAGE EVALUATION:
    Description: ${imageDescription}
    Composition/Subject Layout: ${imageDescription}
    
    Your goal is to choose settings that:
    1. Place text in "dead space" or areas with low visual complexity.
    2. Ensure text doesn't cover important subjects (faces, products, text labels).
    3. Use contrast (dimming/blur/color) to make text stand out.
    
    Respond ONLY with JSON:
    {
      "text": "suggested short hook (optional string)",
      "placement": "top" | "center" | "bottom",
      "textColor": "#E0E5EB" | "#FFFFFF" | "#101417" | "#462D6E",
      "textSize": "S" | "M" | "L" | "XL",
      "dimming": number, // 0 to 0.8
      "blur": number,    // 0 to 20
      "rationale": "short explanation of why these settings were chosen (max 15 words)"
    }`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250524',
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Suggest the optimal overlay configuration for this image.' }],
    })

    const suggestion = parseAnthropicJson<OverlayConfig & { rationale: string }>(message)

    // Log tokens
    await supabase.from('token_ledger').insert({
      user_id: user.id,
      operation: 'image_suggest_overlay',
      tokens_used: 500,
      metadata: { unsplash_id: image.unsplashId }
    })

    return NextResponse.json(suggestion)

  } catch (error: any) {
    console.error('Error suggesting overlay:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
