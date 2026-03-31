import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createApi } from 'unsplash-js'
import { genAI } from '@/lib/gemini'
import type { VisualBrief, ScoredImage } from '@/lib/social-content'

const unsplashBase = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY || '',
  fetch: fetch,
})

async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string }> {
  const res = await fetch(url)
  const arrayBuffer = await res.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return {
    data: buffer.toString('base64'),
    mimeType: res.headers.get('content-type') || 'image/jpeg'
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUser()
    const supabase = await createClient()
    const { brief, post_content, platform, count_per_query = 6, feedback } = await req.json()

    if (!brief || !brief.queries) {
      return NextResponse.json({ error: 'Missing visual brief' }, { status: 400 })
    }

    // STEP A: Parallel Unsplash searches
    const searchPromises = brief.queries.map((q: any) =>
      unsplashBase.search.getPhotos({
        query: q.query,
        perPage: count_per_query,
        orientation: platform === 'instagram' ? 'squarish' : 'landscape'
      })
    )

    const searchResults = await Promise.all(searchPromises)
    
    // Flatten and deduplicate
    const rawPhotos = searchResults.flatMap((res, i) => {
      if (res.errors || !res.response) return []
      return res.response.results.map((p: any) => ({
        ...p,
        query_source: brief.queries[i].query
      }))
    })

    const uniquePhotosMap = new Map()
    for (const p of rawPhotos) {
      if (!uniquePhotosMap.has(p.id)) {
        uniquePhotosMap.set(p.id, p)
      }
    }
    const photosToScore = Array.from(uniquePhotosMap.values()).slice(0, 12)

    // STEP B: Gemini Vision scoring (Streaming Response)
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash'
          }, { apiVersion: 'v1beta' })

          const scoreImage = async (p: { 
            id: string; 
            urls: { regular: string; small: string }; 
            user: { name: string }; 
            query_source: string 
          }): Promise<ScoredImage | null> => {
            try {
              const { data: base64Data, mimeType } = await fetchImageAsBase64(p.urls.regular + '?w=400&q=70')
              
              const prompt = `You are scoring images for social media posts.
                 
                 Visual brief for this post:
                 Mood: ${brief.visual_brief.mood}
                 Composition needed: ${brief.visual_brief.composition}
                 Colors: ${brief.visual_brief.color_palette}
                 Subject: ${brief.visual_brief.subject_matter}
                 Avoid: ${brief.visual_brief.avoid.join(', ')}
                 
                 Post context: ${brief.ideal_image_description}
                 
                 ${feedback ? `USER FEEDBACK ON PREVIOUS RESULTS:
                 "${feedback}"
                 Please ensure the scores reflect how well the image addresses this specific request.` : ''}
                 
                 Score this image on a scale 0.0-1.0 for how well it matches the visual brief.
                 
                 Consider:
                 - Mood alignment (40% weight)
                 - Compositional fit for text overlay (30% weight)
                 - Color palette compatibility (20% weight)
                 - Subject matter relevance (10% weight)
                 
                 Respond ONLY with JSON:
                 {
                   "score": float,
                   "mood_match": float,
                   "composition_match": float,
                   "color_match": float,
                   "subject_match": float,
                   "verdict": "string",
                   "best_for": "cover" | "content" | "cta" | "any"
                 }`

              const result = await model.generateContent([
                {
                  inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                  }
                },
                {
                  text: prompt
                }
              ])

              const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim()
              const parsed = JSON.parse(responseText)

              const scored: ScoredImage = {
                unsplashId: p.id,
                url: p.urls.regular,
                thumbUrl: p.urls.small,
                photographer: p.user.name,
                scores: {
                  total: parsed.score,
                  mood: parsed.mood_match,
                  composition: parsed.composition_match,
                  color: parsed.color_match,
                  subject: parsed.subject_match
                },
                verdict: parsed.verdict,
                best_for: parsed.best_for,
                query_source: p.query_source
              }

              // Send update through stream
              controller.enqueue(encoder.encode(JSON.stringify({ type: 'image_scored', data: scored }) + '\n'))
              return scored

            } catch (err) {
              console.error('Error scoring image:', p.id, err)
              return null
            }
          }

          // Execute in parallel
          const scoredResults = await Promise.all(photosToScore.map(scoreImage))
          const validResults = scoredResults.filter((r): r is ScoredImage => r !== null)
          
          // Categorize and send final payload
          validResults.sort((a, b) => b.scores.total - a.scores.total)
          
          const finalData = {
            type: 'complete',
            recommended: validResults.filter(r => r.scores.total >= 0.75),
            good: validResults.filter(r => r.scores.total >= 0.5 && r.scores.total < 0.75),
            alternatives: validResults.filter(r => r.scores.total < 0.5),
            brief: brief,
            queries_used: brief.queries.map((q: any) => q.query)
          }

          controller.enqueue(encoder.encode(JSON.stringify(finalData) + '\n'))
          
          // Log tokens
          await supabase.from('token_ledger').insert({
            user_id: user.id,
            operation: 'image_score',
            tokens_used: validResults.length * 200,
            metadata: { count: validResults.length }
          })

          controller.close()
        } catch (err: any) {
          controller.error(err)
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })

  } catch (error: any) {
    console.error('Error in recommend route:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
