/**
 * Iconify API Client for social.noctra.studio
 * Provides access to 200,000+ icons from 150+ libraries.
 */

export type IconStyle = 'outline' | 'solid' | 'bold' | 'duotone';

export type IconifyIcon = {
  name: string;          // e.g. 'ph:arrow-right-bold'
  prefix: string;        // e.g. 'ph'
  body: string;          // SVG body content
  width: number;
  height: number;
  tags?: string[];
};

export type IconifySearchResult = {
  icons: string[];       // array of icon names: 'prefix:name'
  total: number;
  start: number;
  limit: number;
};

// Map style preference to preferred library prefixes
const STYLE_LIBRARY_MAP: Record<IconStyle, string[]> = {
  outline: ['ph', 'tabler', 'heroicons', 'lucide'],
  solid: ['ph-fill', 'heroicons-solid', 'material-symbols-rounded', 'lucide-filled'],
  bold: ['ph-bold', 'tabler-bold', 'ri-bold'],
  duotone: ['ph-duotone', 'bi-duotone', 'ri-duotone'],
};

/**
 * Search icons by keyword
 */
export async function searchIcons(
  query: string,
  options: {
    limit?: number;
    style?: IconStyle;
    prefixes?: string[]; // filter to specific libraries
  } = {}
): Promise<IconifySearchResult> {
  const searchPrefixes = options.prefixes && options.prefixes.length > 0
    ? options.prefixes.join(',')
    : (options.style ? STYLE_LIBRARY_MAP[options.style].join(',') : 'ph,tabler,heroicons,ri');

  const url = new URL('https://api.iconify.design/search');
  url.searchParams.append('query', query);
  url.searchParams.append('limit', String(options.limit ?? 54));
  url.searchParams.append('prefixes', searchPrefixes);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Iconify search failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch specific icon SVG data
 */
export async function fetchIcon(
  iconName: string
): Promise<IconifyIcon | null> {
  const [prefix, name] = iconName.includes(':') ? iconName.split(':') : ['', iconName];
  if (!prefix || !name) return null;

  try {
    const response = await fetch(`https://api.iconify.design/${prefix}/${name}.json`);
    if (!response.ok) return null;

    const data = await response.json();
    
    return {
      name: iconName,
      prefix,
      body: data.body,
      width: data.width ?? 24,
      height: data.height ?? 24,
    };
  } catch (error) {
    console.error(`Error fetching icon ${iconName}:`, error);
    return null;
  }
}

/**
 * Convert Iconify icon to full SVG string
 */
export function iconToSVG(icon: IconifyIcon, color = 'currentColor'): string {
  // Sanitize SVG (basic protection)
  const cleanBody = icon.body.replace(/<script[^>]*>.*?<\/script>/gi, '');
  
  return `<svg xmlns="http://www.w3.org/2000/svg" 
               viewBox="0 0 ${icon.width} ${icon.height}"
               width="${icon.width}"
               height="${icon.height}">
    ${cleanBody.replace(/currentColor/g, color)}
  </svg>`;
}

/**
 * Get popular icon libraries metadata
 */
export const POPULAR_LIBRARIES = [
  { id: 'ph', name: 'Phosphor', count: '7,488', description: 'Consistentes y modernos' },
  { id: 'tabler', name: 'Tabler', count: '4,765', description: 'Outlines limpios' },
  { id: 'heroicons', name: 'Heroicons', count: '292', description: 'Minimalistas de Tailwind' },
  { id: 'material-symbols', name: 'Material', count: '10,000+', description: 'Estándar Google' },
  { id: 'ri', name: 'Remix Icons', count: '2,271', description: 'Neutros y versátiles' },
  { id: 'bi', name: 'Bootstrap', count: '1,986', description: 'Clásicos de UI' },
];

/**
 * Curated categories for zero-search state
 */
export const CURATED_CATEGORIES = [
  { label: 'Flechas', query: 'arrow' },
  { label: 'Negocios', query: 'business briefcase' },
  { label: 'Datos', query: 'chart analytics' },
  { label: 'Digital', query: 'globe web internet' },
  { label: 'UI', query: 'check close menu settings' },
  { label: 'Social', query: 'heart share message' },
  { label: 'Lugares', query: 'home building map' },
  { label: 'Acciones', query: 'flash power energy' },
];
