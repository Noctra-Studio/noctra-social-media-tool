/**
 * Smart Query Engine for Unsplash - social.noctra.studio
 * Handles Spanish-to-English visual keyword mapping and domain detection.
 */

export const MOOD_CATEGORIES = [
  {
    id: 'dark-minimal',
    label: 'Oscuro Minimal',
    emoji: '◼',
    color: '#1a1a1a',
    queries: ['dark minimal desk', 'dark workspace clean', 'minimal dark aesthetic'],
    description: 'Fondos oscuros y limpios'
  },
  {
    id: 'editorial',
    label: 'Editorial',
    emoji: '📰',
    color: '#2a2018',
    queries: ['editorial photography dark', 'magazine layout dark', 'black white editorial'],
    description: 'Estilo revista, alto contraste'
  },
  {
    id: 'tech',
    label: 'Tecnología',
    emoji: '⚡',
    color: '#0a1628',
    queries: ['dark technology abstract', 'circuit board dark', 'code screen dark aesthetic'],
    description: 'Digital, código, datos'
  },
  {
    id: 'architecture',
    label: 'Arquitectura',
    emoji: '🏛',
    color: '#141414',
    queries: ['minimal architecture dark', 'building geometric shadow', 'concrete texture minimal'],
    description: 'Estructuras, geometría, espacio'
  },
  {
    id: 'nature-dark',
    label: 'Naturaleza',
    emoji: '🌿',
    color: '#0a1a10',
    queries: ['dark nature moody', 'forest fog minimal', 'botanical dark aesthetic'],
    description: 'Naturaleza con moodboard oscuro'
  },
  {
    id: 'abstract',
    label: 'Abstracto',
    emoji: '◐',
    color: '#1a0a2e',
    queries: ['abstract dark gradient', 'geometric abstract minimal', 'dark texture bokeh'],
    description: 'Formas, texturas, gradientes'
  },
  {
    id: 'workspace',
    label: 'Trabajo',
    emoji: '💼',
    color: '#1a1208',
    queries: ['professional workspace dark', 'desk setup minimal', 'office dark aesthetic'],
    description: 'Escritorios, oficina, productividad'
  },
  {
    id: 'urban',
    label: 'Ciudad',
    emoji: '🌆',
    color: '#0a0e1a',
    queries: ['city night dark', 'urban architecture moody', 'street photography dark'],
    description: 'Ciudad, noche, movimiento'
  },
  {
    id: 'light-clean',
    label: 'Claro Limpio',
    emoji: '◻',
    color: '#f0f0f0',
    queries: ['white minimal clean', 'light background minimal', 'clean aesthetic bright'],
    description: 'Fondos claros y minimalistas'
  },
  {
    id: 'warm',
    label: 'Cálido',
    emoji: '🔥',
    color: '#2d1200',
    queries: ['warm dark moody', 'orange amber dark aesthetic', 'golden hour dark'],
    description: 'Tonos cálidos, ambar, tierra'
  },
  {
    id: 'creative',
    label: 'Creativo',
    emoji: '🎨',
    color: '#1a0a1a',
    queries: ['creative studio dark', 'art design workspace', 'colorful dark aesthetic'],
    description: 'Arte, diseño, creatividad'
  },
  {
    id: 'people',
    label: 'Personas',
    emoji: '👤',
    color: '#1a1418',
    queries: ['person working dark', 'professional portrait moody', 'silhouette dark minimal'],
    description: 'Personas, retratos, siluetas'
  }
];

export const VISUAL_MODIFIERS = [
  'minimal clean professional',
  'dark moody aesthetic',
  'high contrast editorial',
  'modern architectural geometric',
  'clean simple workspace',
  'professional premium quality',
  'abstract texture minimal'
];

export function getVisualModifier(): string {
  return VISUAL_MODIFIERS[Math.floor(Math.random() * VISUAL_MODIFIERS.length)];
}

const DOMAIN_MAP = {
  web: ['sitio', 'web', 'página', 'diseño', 'desarrollo', 'mockup'],
  seo: ['seo', 'búsqueda', 'google', 'posicionamiento', 'orgánico', 'rank'],
  ai: ['ia', 'inteligencia', 'automatización', 'modelo', 'gpt', 'neural'],
  branding: ['marca', 'identidad', 'logo', 'brand', 'visual', 'grafismo'],
  ecommerce: ['tienda', 'ventas', 'producto', 'comercio', 'shop', 'carrito'],
  realestate: ['inmueble', 'propiedad', 'casa', 'departamento', 'renta', 'arquitectura'],
  education: ['aprende', 'curso', 'educación', 'habilidad', 'formación', 'clase'],
  finance: ['dinero', 'inversión', 'financiero', 'costo', 'precio', 'roi'],
  strategy: ['estrategia', 'plan', 'proceso', 'sistema', 'método', 'operación'],
  results: ['resultado', 'caso', 'cliente', 'éxito', 'logro', 'meta'],
  legal: ['ley', 'derecho', 'abogado', 'legal', 'juicio', 'notaría'],
  medical: ['salud', 'médico', 'doctor', 'clínica', 'hospital', 'paciente'],
  saas: ['plataforma', 'software', 'herramienta', 'app', 'aplicación', 'interfaz'],
  coach: ['mentor', 'guía', 'crecimiento', 'desarrollo', 'mente', 'mentalidad', 'hábitos'],
  lifestyle: ['vida', 'rutina', 'café', 'viaje', 'mañana', 'minimalismo', 'estética'],
};

const QUERY_MAP = {
  web: 'dark minimal website mockup laptop screen',
  seo: 'search engine optimization analytics dark dashboard data',
  ai: 'abstract dark technology artificial intelligence neural network',
  branding: 'brand identity minimal dark photography project',
  ecommerce: 'product photography minimal premium dark aesthetic',
  realestate: 'modern architecture luxury minimal interior dark shadow',
  education: 'focused study minimal desk dark library professional',
  finance: 'financial growth chart minimal dark money',
  strategy: 'chess pieces focus dark minimal strategy',
  results: 'success achievement trophy minimal dark light',
  legal: 'justice law scales minimal dark architecture professional',
  medical: 'health medical science minimal clean dark professional',
  saas: 'modern minimalist software platform ui dark',
  coach: 'minimalist meditation workspace zen dark',
  lifestyle: 'minimalist coffee beans desk dark morning productive',
  default: 'dark minimal professional workspace premium',
};

const MOOD_MAP = {
  web: 'tech',
  seo: 'tech',
  ai: 'abstract',
  branding: 'editorial',
  ecommerce: 'workspace',
  realestate: 'architecture',
  education: 'workspace',
  finance: 'dark-minimal',
  strategy: 'dark-minimal',
  results: 'editorial',
  legal: 'architecture',
  medical: 'creative',
  saas: 'tech',
  coach: 'abstract',
  lifestyle: 'workspace',
  default: 'dark-minimal',
};

/**
 * Generates a visual English query for Unsplash based on Spanish context.
 */
export function generateSmartQuery(
  caption: string,
  angle: string,
  platform: string,
  slideType: 'cover' | 'content' | 'cta'
): { query: string; suggestedMoodId: string } {
  const cleanCaption = (caption || '').toLowerCase();
  let detectedDomain = 'default';

  // Step 1: Detect domain
  for (const [domain, keywords] of Object.entries(DOMAIN_MAP)) {
    if (keywords.some((k) => cleanCaption.includes(k))) {
      detectedDomain = domain;
      break;
    }
  }

  // Step 2 & 3: Map domain to query and mood
  let query = QUERY_MAP[detectedDomain as keyof typeof QUERY_MAP] || QUERY_MAP.default;
  const suggestedMoodId = MOOD_MAP[detectedDomain as keyof typeof MOOD_MAP] || MOOD_MAP.default;

  // Step 4: Apply slide type modifier
  const modifier = getVisualModifier();
  
  if (slideType === 'cover') {
    query = `${query} ${modifier}`;
  } else if (slideType === 'content') {
    query = `clean ${query}`;
  } else if (slideType === 'cta') {
    query = `minimal ${query} focus`;
  }

  return { query, suggestedMoodId };
}
