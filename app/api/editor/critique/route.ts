import { NextRequest, NextResponse } from 'next/server'
import { genAI } from '@/lib/gemini'
import { requireRouteUser } from '@/lib/auth/require-route-user'

export async function POST(req: NextRequest) {
  try {
    const { response } = await requireRouteUser()

    if (response) {
      return response
    }

    const { imageBase64, slideType, platform, angle } = await req.json()

    if (!imageBase64) {
      return NextResponse.json({ error: 'Falta la imagen' }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = `You are an expert social media designer analyzing an
             ${platform} ${slideType} slide for ${angle} content.
             
             Evaluate this slide on these criteria:
             1. Text readability and contrast
             2. Visual hierarchy (is headline clearly dominant?)
             3. Composition and use of space
             4. Brand consistency and professionalism
             5. ${platform} feed performance potential
             
             Be specific and actionable. Reference actual elements
             you can see (colors, text size, positioning).
             
             Respond ONLY in JSON with the following structure:
             {
               "overall_score": number (0-10),
               "grade": "A" | "B" | "C" | "D",
               "summary": "string (max 20 words)",
               "strengths": ["string", "string"],
               "issues": [{
                 "severity": "high" | "medium" | "low",
                 "element": "string (what element has the issue)",
                 "problem": "string (what's wrong, specific)",
                 "fix": "string (exact actionable fix)"
               }],
               "quick_wins": ["string", "string"]
             }`

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'image/png',
          data: imageBase64
        }
      },
      { text: prompt }
    ])

    const aiResponse = await result.response
    const text = aiResponse.text()
    
    // Clean-up markdown-style JSON blocks if present
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim()
    
    try {
      const parsed = JSON.parse(cleanJson)
      return NextResponse.json(parsed)
    } catch {
      console.error('Gemini JSON Parse Error:', text)
      return NextResponse.json({ error: 'Error al procesar la respuesta de la IA' }, { status: 500 })
    }

  } catch (error) {
    console.error('Critique API Error:', error)
    return NextResponse.json({ error: 'Error en el análisis del diseño' }, { status: 500 })
  }
}
