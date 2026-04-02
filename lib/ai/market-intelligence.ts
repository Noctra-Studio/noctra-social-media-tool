/**
 * Market Intelligence — Noctra Studio
 * Consulta fuentes actuales para contextualizar la generación de contenido.
 * Usa Anthropic web_search tool para obtener señales del mercado en tiempo real.
 */

import { anthropic } from '@/lib/anthropic'

export type MarketSignal = {
  topic: string
  insight: string
  source_type: 'trend' | 'stat' | 'news' | 'prediction'
  relevance: 'high' | 'medium'
  platform_fit: string[]
}

export type MarketContext = {
  signals: MarketSignal[]
  generated_at: string
  query_used: string
}

/**
 * Mapeo de temas de Noctra a queries de búsqueda enfocados en México y expansión internacional.
 */
const TOPIC_SEARCH_QUERIES: Record<string, string[]> = {
  ai_business: [
    'Mexican tech companies selling software to USA trends 2025',
    'AI automation ROI for Mexican export businesses nearshoring',
  ],
  real_estate: [
    'Mexico real estate investment for Americans 2025 trends',
    'selling Mexican properties to foreign investors marketing tips',
  ],
  education: [
    'Mexican edtech expanding to USA and LATAM markets 2025',
    'international accreditation for Mexican private schools trends',
  ],
  healthcare: [
    'medical tourism Mexico 2025 marketing strategies',
    'Mexican dental clinics attracting USA patients online presence',
  ],
  legal: [
    'Mexican law firms specialized in nearshoring marketing tips',
    'legal services for foreign companies entering Mexico 2025',
  ],
  seo_geo: [
    'SEO for Mexican businesses targeting USA consumers 2025',
    'GEO Generative Engine Optimization for international expansion',
  ],
  crm: [
    'CRM for Mexican export companies tracking international leads',
    'sales pipeline management for cross-border businesses Mexico',
  ],
  branding: [
    'Mexican brand identity for international markets trends 2025',
    'how Mexican startups build global trust through branding',
  ],
  web_performance: [
    'cross-border e-commerce website performance Mexico 2025',
    'landing page optimization for international conversion Noctra',
  ],
  entrepreneurship: [
    'Mexico nearshoring boom 2025 opportunities for SMBs',
    'Mexican companies expanding to USA tips and pain points',
  ],
}

/**
 * Detecta el tema más relevante según la idea del usuario.
 */
export function detectTopicFromIdea(idea: string): string {
  const lower = idea.toLowerCase()

  const topicMap: Record<string, string[]> = {
    ai_business: ['ia', 'inteligencia artificial', 'automatización', 'ai', 'gpt', 'claude', 'software'],
    real_estate: ['inmobiliaria', 'propiedad', 'bienes raíces', 'real estate', 'constructora', 'renta', 'inversión'],
    education: ['escuela', 'colegio', 'educación', 'estudiante', 'docente', 'edtech', 'curso'],
    healthcare: ['médico', 'doctor', 'clínica', 'salud', 'paciente', 'dental', 'turismo médico'],
    legal: ['abogado', 'despacho', 'jurídico', 'legal', 'notario', 'ley', 'constitución'],
    seo_geo: ['seo', 'geo', 'búsqueda', 'posicionamiento', 'google', 'visibilidad', 'búsqueda ai'],
    crm: ['crm', 'clientes', 'seguimiento', 'pipeline', 'ventas', 'leads', 'embudo'],
    branding: ['marca', 'identidad', 'logo', 'branding', 'brand', 'confianza', 'imagen'],
    web_performance: ['landing', 'página web', 'sitio', 'conversión', 'velocidad', 'e-commerce'],
    entrepreneurship: ['emprendedor', 'startup', 'negocio', 'empresa', 'fundador', 'nearshoring', 'exportar', 'internacional'],
  }

  for (const [topic, keywords] of Object.entries(topicMap)) {
    if (keywords.some(k => lower.includes(k))) {
      return topic
    }
  }

  return 'entrepreneurship' // default
}

/**
 * Busca señales de mercado actuales usando Anthropic web_search.
 */
export async function fetchMarketIntelligence(
  idea: string,
  platform: string
): Promise<MarketContext | null> {
  try {
    const topic = detectTopicFromIdea(idea)
    const queries = TOPIC_SEARCH_QUERIES[topic] ?? TOPIC_SEARCH_QUERIES.entrepreneurship
    const searchQuery = queries[0]

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
        } as any,
      ],
      system: `Eres un estratega de crecimiento para Noctra Studio en México.
Tu misión es encontrar datos sobre cómo negocios mexicanos están creciendo
al vender al extranjero (nearshoring, servicios exportables, turismo).
Busca señales que demuestren cómo la tecnología y el diseño (puente Noctra)
ayudan a superar los pain points del mercado internacional (falta de confianza,
procesos lentos, presencia digital pobre).

Extrae solo datos concretos: estadísticas, tendencias, predicciones de 2025.
Responde SOLO con JSON válido al final, sin texto adicional.`,
      messages: [
        {
          role: 'user',
          content: `Busca información actual sobre: ${searchQuery}

También busca: ${queries[1] ?? searchQuery}

Contexto: voy a crear contenido para una agencia que ayuda a empresas
mexicanas a proyectarse internacionalmente con tecnología de punta.

Después de buscar, extrae 3-4 señales de mercado útiles y devuelve
SOLO este JSON:
{
  "signals": [
    {
      "topic": "string corto",
      "insight": "dato específico sobre México/LATAM vendiendo al exterior",
      "source_type": "trend" | "stat" | "news" | "prediction",
      "relevance": "high" | "medium",
      "platform_fit": ["instagram", "linkedin", "x"]
    }
  ],
  "query_used": "${searchQuery}"
}`,
        },
      ],
    })

    // Extrae el texto final del response (después de los tool_use blocks)
    // Buscamos cualquier bloque de texto. Como el system prompt pide JSON al final,
    // es probable que Claude escupa el JSON después del tool output.
    const textBlock = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('')

    if (!textBlock.trim()) return null

    const cleanJson = textBlock
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    const parsed = JSON.parse(cleanJson) as {
      signals: MarketSignal[]
      query_used: string
    }

    return {
      signals: parsed.signals ?? [],
      generated_at: new Date().toISOString(),
      query_used: parsed.query_used ?? searchQuery,
    }
  } catch (error) {
    // Silencioso — si falla el search, la generación continúa sin él
    console.error('Market intelligence fetch failed:', error)
    return null
  }
}

/**
 * Formatea las señales de mercado para inyectar en el system prompt.
 */
export function formatMarketSignalsForPrompt(
  context: MarketContext | null
): string {
  if (!context || context.signals.length === 0) return ''

  const signals = context.signals
    .filter(s => s.relevance === 'high')
    .slice(0, 3)

  if (signals.length === 0) return ''

  return `
## CONTEXTO DE MERCADO ACTUAL (fuentes recientes)
${signals.map(s =>
  `- [${s.source_type.toUpperCase()}] ${s.insight}`
).join('\n')}

Usa estos datos como contexto para hacer el contenido más relevante
y actual. Cítalos cuando aporten credibilidad al post.
`
}
