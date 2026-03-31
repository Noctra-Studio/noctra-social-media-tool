/**
 * Generates an optimized English visual query for Unsplash based on post content.
 * Follows a multi-step logic to ensure high-quality, on-brand results.
 */
export function generateVisualQuery(
  caption: string,
  angle: string,
  platform: string
): string {
  // 1. Strip Spanish characters and normalize
  const cleanCaption = caption
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s]/g, '');

  // 2. Step 1: Detect topic domain from caption
  let domain = 'dark minimal professional';
  
  const domains = [
    { keywords: ['web', 'digital', 'app', 'software', 'code'], result: 'dark minimal workspace' },
    { keywords: ['seo', 'search', 'google', 'rank', 'audit'], result: 'city lights aerial dark' },
    { keywords: ['brand', 'identity', 'logo', 'design', 'visual'], result: 'brand identity minimal dark' },
    { keywords: ['automation', 'ai', 'intellectual', 'robot', 'future'], result: 'abstract dark technology' },
    { keywords: ['ecommerce', 'shop', 'sales', 'product', 'store'], result: 'product photography dark' },
    { keywords: ['real estate', 'prop', 'house', 'building', 'home'], result: 'modern architecture minimal' },
    { keywords: ['education', 'learn', 'study', 'course', 'academy'], result: 'focused study minimal' },
    { keywords: ['finance', 'money', 'investment', 'roi', 'business'], result: 'clean desk professional' },
    { keywords: ['social media', 'instagram', 'linkedin', 'phone', 'post'], result: 'phone screen dark minimal' },
    { keywords: ['strategy', 'plan', 'goal', 'chess', 'vision'], result: 'chess pieces dark' },
    { keywords: ['growth', 'scale', 'plant', 'up', 'more'], result: 'plant dark minimal' },
    { keywords: ['case study', 'results', 'data', 'office', 'success'], result: 'office professional dark' },
  ];

  for (const d of domains) {
    if (d.keywords.some(k => cleanCaption.includes(k))) {
      domain = d.result;
      break;
    }
  }

  // 3. Step 2: Apply angle modifier
  let angleMod = '';
  const lowerAngle = angle.toLowerCase();
  if (lowerAngle.includes('opinion') || lowerAngle.includes('contrarian')) angleMod = 'editorial ';
  else if (lowerAngle.includes('historia') || lowerAngle.includes('story')) angleMod = 'cinematic ';
  else if (lowerAngle.includes('data') || lowerAngle.includes('caso')) angleMod = 'clean ';
  else if (lowerAngle.includes('tutorial') || lowerAngle.includes('bts')) angleMod = 'focused ';

  // 4. Step 3: Apply platform modifier
  let platformMod = '';
  const lowerPlatform = platform.toLowerCase();
  if (lowerPlatform === 'instagram') platformMod = ' aesthetic';
  else if (lowerPlatform === 'linkedin') platformMod = ' professional';

  return `${angleMod}${domain}${platformMod}`;
}
