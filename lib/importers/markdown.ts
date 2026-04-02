import { type Platform } from '@/lib/product';

export interface ImportedPost {
  day: number;
  platform: Platform;
  headline: string;
  body: string;
  caption: string;
  angle: string;
}

export function parseMarkdownContent(content: string): ImportedPost[] {
  const posts: ImportedPost[] = [];
  const days = content.split(/# Día\s*(\d+)/i);
  
  // days[0] is the content before the first # Día X
  for (let i = 1; i < days.length; i += 2) {
    const dayNumber = parseInt(days[i]);
    const dayContent = days[i + 1];
    
    if (!dayContent) continue;

    // Split by platform if specified, otherwise assume a generic structure
    // For now, let's assume a simpler structure as requested by the user:
    // ## Titular: [Text]
    // ## Cuerpo: [Text]
    // ## CTA: [Text]
    
    const headlineMatch = dayContent.match(/##\s*Titular:\s*(.*)/i);
    const bodyMatch = dayContent.match(/##\s*Cuerpo:\s*([\s\S]*?)(?=##|$)/i);
    const ctaMatch = dayContent.match(/##\s*CTA:\s*(.*)/i);
    const platformMatch = dayContent.match(/##\s*Plataforma:\s*(.*)/i);

    const platform = (platformMatch?.[1]?.toLowerCase().trim() as Platform) || 'linkedin';

    posts.push({
      day: dayNumber,
      platform,
      headline: headlineMatch?.[1]?.trim() || '',
      body: bodyMatch?.[1]?.trim() || '',
      caption: ctaMatch?.[1]?.trim() || '',
      angle: 'Importado',
    });
  }

  return posts;
}
