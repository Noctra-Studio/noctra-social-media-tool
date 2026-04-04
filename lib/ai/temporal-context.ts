/**
 * Temporal awareness utilities for content generation prompts.
 * Ensures AI-generated content uses the correct year as "present".
 */

/**
 * Builds a dynamic temporal context block to inject at the top of every
 * generation system prompt. All year/month values are computed from new Date()
 * so they stay correct without manual updates.
 */
export function buildTemporalContext(): string {
  const now = new Date()
  const year = now.getFullYear()
  const yearPrev = year - 1
  const yearNext = year + 1
  const month = new Intl.DateTimeFormat('es-MX', { month: 'long' }).format(now)

  return `## CONTEXTO TEMPORAL — LEE ESTO PRIMERO
Fecha actual: ${month} de ${year}.

REGLAS ABSOLUTAS de referencias temporales:
- ${yearPrev} = año pasado. Solo úsalo para: tendencias que iniciaron
  entonces y ahora son realidad consolidada, o para contrastar con el presente.
  Ejemplo correcto: "Lo que en ${yearPrev} era experimento, hoy ya es estándar."
- ${year} = ahora. Este es el año vigente de TODA afirmación actual.
- NUNCA uses "${yearPrev}" como si fuera presente o futuro.
- NUNCA escribas "en ${yearPrev} veremos" o "la tendencia de ${yearPrev}"
  como si aún no hubiera ocurrido.
- Para proyecciones: usa "en los próximos meses", "para finales de ${year}",
  "en ${yearNext}" — siempre relativo al año actual.

MARCO NARRATIVO CORRECTO:
✗ MAL: "En ${yearPrev}, la IA empezará a transformar el marketing digital"
✓ BIEN: "Lo que en ${yearPrev} era experimento, en ${year} ya es estándar operativo"
✓ BIEN: "Las agencias que adoptaron IA el año pasado ya ven resultados medibles"
✓ BIEN: "El siguiente paso — lo que viene en los próximos 12 meses — es..."`
}

/**
 * Geographic and cultural filter for LATAM-relevant content generation.
 * Teaches the model to translate global trends through a Mexico/LATAM lens.
 */
export function buildLatamGeoContext(): string {
  return `## CONTEXTO GEOGRÁFICO Y CULTURAL — LATAM PRIMERO

La audiencia principal es: PYMEs, startups, profesionales independientes
y agencias en México y América Latina.

### REGLA CENTRAL DE FILTRO GEOGRÁFICO:
Antes de usar cualquier referencia, estadística, caso de estudio o tendencia
de otro país o región, aplica este filtro mental:

  ¿Esto ya ocurrió, está ocurriendo, o tiene alta probabilidad de ocurrir
  en México/LATAM en los próximos 12 meses?

  → SÍ: úsalo, pero aterrízalo en contexto LATAM
  → NO o INCIERTO: descártalo o menciónalo como "tendencia que viene"

### LO QUE ES DIRECTAMENTE APLICABLE A LATAM (usa con confianza):
- Tendencias de adopción de IA en negocios pequeños y medianos
  (el patrón de adopción lleva 12-18 meses de rezago vs USA, pero llega)
- Estrategias de SEO y posicionamiento digital (Google opera igual en LATAM)
- Principios de branding, identidad visual y comunicación de marca
- Automatización de procesos de negocio (CRMs, flujos, reportes)
- E-commerce y presencia digital para negocios físicos
- Educación online y plataformas de capacitación
- Estrategias de contenido en redes sociales (Instagram, LinkedIn, X son
  igual de relevantes en LATAM que en cualquier otro mercado)
- Casos de startups globales que ya operan en México/LATAM (Shopify, HubSpot,
  Notion, Figma, Stripe — su adopción es real y creciente)

### LO QUE NO ES DIRECTAMENTE APLICABLE — TRADUCIR O DESCARTAR:
- Regulaciones o leyes de privacidad europeas (GDPR no aplica aquí;
  en México existe la LFPDPPP — si el tema es legal, usa la referencia correcta)
- Estadísticas de mercado laboral de USA/Europa sin equivalente LATAM
- Hábitos de consumo digital de mercados maduros que aún no se replican aquí
  (ejemplo: penetración de pagos sin contacto, banking digital avanzado)
- Nombres de empresas o marcas sin presencia conocida en México
- Plataformas o herramientas que no tienen soporte en español o facturación
  en MXN/monedas LATAM (son ruido para la audiencia objetivo)
- Referencias culturales, modismos o humor de otros mercados que no
  resuenen en México

### CÓMO USAR TENDENCIAS GLOBALES CORRECTAMENTE:
Cuando una tendencia viene de USA, Europa u Asia y ES relevante para LATAM,
el marco narrativo correcto es:

  ✗ MAL: "En Europa, las empresas ya están haciendo X — deberías hacerlo"
  ✓ BIEN: "Lo que comenzó en mercados como el de USA ya está llegando a México:
           las empresas que se adelanten van a tener ventaja"

  ✗ MAL: "Según datos del mercado europeo, el 73% de las empresas usa IA"
  ✓ BIEN: "En mercados más maduros, la adopción de IA en PYMEs ya supera el 60%.
           En México, ese número crece — y las agencias que lleven a sus clientes
           ahí primero van a ganar la cuenta."

  La regla: convierte la referencia global en una oportunidad para LATAM,
  no en una comparación que haga sentir al lector fuera de la conversación.

### SENSIBILIDAD DE MERCADO MEXICO/LATAM:
- El precio siempre es un factor: los argumentos de valor deben justificar
  la inversión en pesos, no en dólares abstractos
- La confianza se construye más lento que en mercados anglosajones —
  el contenido debe reflejar proceso, transparencia y resultados reales
- WhatsApp es el canal de comunicación de negocios dominante, no el email
- Las decisiones de compra en PYMEs las toma el dueño, no un equipo —
  el contenido debe hablarle a esa persona directamente
- "Digital" no es sinónimo de "moderno" para todos los clientes —
  hay que traducir tecnología a resultado de negocio siempre`
}

/**
 * Static industry intelligence scoped to Noctra's market.
 * Update manually each quarter as the market evolves.
 */
export function buildNoctraIndustryContext(): string {
  return `## INDUSTRIA DIGITAL — Estado actual para contenido de Noctra Studio
Enfoque: agencias digitales boutique, desarrollo web, SEO, branding, automatización
con IA. Mercado: PYMEs y profesionales independientes en México/LATAM.

### Lo que 2025 dejó como legado (realidades consolidadas, NO tendencias futuras):
- Los agentes de IA autónomos pasaron de demo a producción en agencias pequeñas
- El "vibe coding" democratizó el desarrollo, pero elevó el valor de quien sabe
  QUÉ construir y para qué — no solo cómo ejecutarlo
- Los clientes LATAM ya preguntan activamente por automatización —
  dejó de ser educación del mercado, es expectativa básica
- El SEO basado solo en texto perdió terreno; ahora es búsqueda multimodal
  + autoridad de marca + presencia en respuestas de IA
- Los sitios hechos con page builders perdieron posición SEO frente
  a performance técnica real (Core Web Vitals, TTFB, estructura semántica)
- La IA generativa en diseño pasó a ser herramienta estándar, no ventaja diferencial

### Lo que define 2026 (presente — afirmar con confianza, no como predicción):
- Las PYMEs en México comparan agencias por sus propias herramientas internas
  y procesos visibles, no solo por portafolio
- La diferencia entre una agencia buena y una mediocre se mide en:
  velocidad de entrega, claridad de proceso, y resultados medibles con números
- Los clientes contratan resultado + proceso transparente, no solo el entregable
- IA + criterio humano > IA sola — el mercado lo aprendió a las malas
  con resultados genéricos y sin estrategia
- El solopreneur con stack de IA y criterio estratégico compite con equipos
  medianos — y gana en velocidad y costo
- Presencia digital = web + búsqueda tradicional + aparición en
  respuestas de Google AI Overview, ChatGPT y Perplexity

### Dirección de la industria — próximos 12-18 meses (proyecciones, no certezas):
- Personalización web dinámica según comportamiento, sin cookies de terceros
- Reportes de cliente generados automáticamente con lenguaje natural
- El ciclo de branding visual + verbal se va a acortar:
  identidades que antes tardaban meses, ahora en semanas con IA supervisada
- Búsqueda por voz y visual gana participación en LATAM con smartphones
- Automatización de flujos de cliente (onboarding, seguimiento, reportes)
  se vuelve diferenciador de agencias que aún no la implementan

### Ángulos de contenido poderosos para Noctra en 2026:
- "Lo que antes tardaba X semanas, hoy tarda Y días" (casos reales de automatización)
- "Por qué los sitios más rápidos no son los más caros" (performance vs presupuesto)
- "Lo que un cliente debería exigirle a su agencia digital en 2026"
- "Cómo Noctra construyó X para cliente Y en Z semanas — proceso completo"
- "El error que cometen la mayoría de PYMEs en México con su presencia digital"
- "IA no reemplaza la estrategia — la amplifica si sabes usarla"

### Nota editorial para referencias externas:
Cuando uses datos de mercados como USA, Europa o Asia en el contenido,
SIEMPRE aplica el filtro LATAM definido en el contexto geográfico:
¿esto ya aplica aquí, está llegando, o es aspiracional?
Esa clasificación determina el tono: certeza, anticipación, o señal de alerta temprana.
No uses estadísticas de otros mercados sin traducirlas a oportunidad para México/LATAM.`
}
