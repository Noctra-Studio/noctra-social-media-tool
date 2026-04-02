import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createApi } from 'unsplash-js'
import { genAI } from '@/lib/gemini'
import { stripMarkdownJSON } from '@/lib/ai/strip-markdown-json'
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
    const { brief, post_content, platform, count_per_query = 8, feedback } = await req.json()

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

    const uniquePhotosMap = new Map<string, any>()
    for (const p of rawPhotos) {
      if (!uniquePhotosMap.has(p.id)) {
        uniquePhotosMap.set(p.id, p)
      }
    }
    const photosToScore = Array.from(uniquePhotosMap.values()).slice(0, 5) as Array<{
      id: string;
      urls: { regular: string; small: string };
      user: { name: string };
      query_source: string;
    }>
    
    const wait = (ms: number) => new Promise(res => setTimeout(res, ms))

    // STEP B: Gemini Vision scoring (Sequential with Retry for 429s)
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash'
          }, { apiVersion: 'v1beta' })

          const validResults: ScoredImage[] = []
          let quotaExhausted = false

          for (let i = 0; i < photosToScore.length; i++) {
            // Break early and skip remaining images if we hit a hard 429
            if (quotaExhausted) {
              const p = photosToScore[i]
              const fallback: ScoredImage = {
                unsplashId: p.id,
                url: p.urls.regular,
                thumbUrl: p.urls.small,
                photographer: p.user.name,
                scores: { total: 0.5, mood: 0.5, composition: 0.5, color: 0.5, subject: 0.5 },
                verdict: "AI Ocupada (Rate Limit).",
                best_for: "any",
                query_source: p.query_source
              }
              validResults.push(fallback)
              controller.enqueue(encoder.encode(JSON.stringify({ type: 'image_scored', data: fallback }) + '\n'))
              continue
            }

            const p = photosToScore[i]
            let attempts = 0
            const maxAttempts = 2
            let scored: ScoredImage | null = null

            while (attempts < maxAttempts) {
              try {
                const { data: base64Data, mimeType } = await fetchImageAsBase64(p.urls.regular + '?w=400&q=70')
                
                const prompt = `You are scoring images for social media posts.
                   
                   Post context: ${brief.ideal_image_description}
                   
                   Score this image on a scale 0.0-1.0 for how well it matches the visual brief.
                   
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
                  { inlineData: { data: base64Data, mimeType } },
                  { text: prompt }
                ])

                const rawText = result.response.text()
                const stripped = stripMarkdownJSON(rawText)
                const startIdx = stripped.indexOf('{')
                const endIdx = stripped.lastIndexOf('}')
                
                if (startIdx === -1) throw new Error('Invalid JSON format')

                const parsed = JSON.parse(stripped.slice(startIdx, endIdx + 1))
                
                const normalize = (val: any) => {
                  const n = parseFloat(val);
                  return n > 1 ? n / 10 : (isNaN(n) ? 0.5 : n);
                };

                scored = {
                  unsplashId: p.id,
                  url: p.urls.regular,
                  thumbUrl: p.urls.small,
                  photographer: p.user.name,
                  scores: {
                    total: normalize(parsed.score),
                    mood: normalize(parsed.mood_match),
                    composition: normalize(parsed.composition_match),
                    color: normalize(parsed.color_match),
                    subject: normalize(parsed.subject_match)
                  },
                  verdict: parsed.verdict || "Match visual detectado.",
                  best_for: parsed.best_for || "any",
                  query_source: p.query_source
                }
                
                validResults.push(scored)
                controller.enqueue(encoder.encode(JSON.stringify({ type: 'image_scored', data: scored }) + '\n'))
                break // Success!

              } catch (err: any) {
                // If it's a 429 and we've tried once, set the exhausted flag to skip next images
                if (err?.status === 429) {
                  quotaExhausted = true
                  console.warn(`Gemini 429 detected during Scoring. Bailing for subsequent images.`)
                  break
                }
                console.error(`Error scoring image ${p.id}:`, err)
                break
              }
            }
            // Larger gap + break on 429 ensures we stay safe
            if (!quotaExhausted) await wait(1800)
          }
          
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
          try {
            await supabase.from('token_ledger').insert({
              user_id: user.id,
              operation: 'image_score',
              tokens_used: validResults.length * 200,
              metadata: { count: validResults.length }
            })
          } catch {}

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
