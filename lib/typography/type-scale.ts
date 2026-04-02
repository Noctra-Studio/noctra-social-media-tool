import { Canvas, StaticCanvas } from 'fabric';

/**
 * Mathematical Ratios for Typographic Scales
 * social.noctra.studio
 */

export const TYPE_SCALE_RATIOS = {
  minor_second:  1.067,
  major_second:  1.125,
  minor_third:   1.200,  // Standard / Balanced
  major_third:   1.250,  // Good for Editorial
  perfect_fourth: 1.333, // Strong Hierarchy
  augmented_fourth: 1.414,
  perfect_fifth:  1.500,
  golden_ratio:   1.618, // Dramatic
};

export type TypeScaleRatioKey = keyof typeof TYPE_SCALE_RATIOS;

export type TypeScale = {
  h1: number; // Heading
  h2: number; // Subheading
  p: number;  // Body
  s: number;  // Small/Supporting
  base: number;
  ratio: number;
  ratioKey: TypeScaleRatioKey;
};

/**
 * Calculates a typographic scale based on a base size and a ratio.
 * Base sizing usually targets lead text (p).
 */
export function generateTypeScale(
  baseSize: number = 40,
  ratioKey: TypeScaleRatioKey = 'minor_third'
): TypeScale {
  const ratio = TYPE_SCALE_RATIOS[ratioKey];

  return {
    h1: Math.round(baseSize * Math.pow(ratio, 2)),
    h2: Math.round(baseSize * Math.pow(ratio, 1)),
    p:  Math.round(baseSize),
    s:  Math.round(baseSize / ratio),
    base: baseSize,
    ratio: ratio,
    ratioKey: ratioKey,
  };
}

/**
 * Applies a typographic scale to all text objects on a canvas.
 */
export function applyTypeScaleToCanvas(
  canvas: StaticCanvas, 
  ratioKey: TypeScaleRatioKey,
  baseSize: number = 40
) {
  const scale = generateTypeScale(baseSize, ratioKey);
  const maxFontSize = 200;
  const objects = canvas.getObjects();

  objects.forEach(obj => {
    if ('fontSize' in obj) {
      const textObj = obj as any; // Still using any here to reach custom 'data' safely in Fabric 6
      const fs = textObj.fontSize;
      const role = textObj.data?.role;
      let calculatedSize = scale.p;

      if (role === 'headline' || fs >= 60) {
        calculatedSize = scale.h1;
      } else if (role === 'subheadline' || (fs >= 18 && fs < 60)) {
        calculatedSize = scale.h2;
      }

      textObj.set('fontSize', Math.min(calculatedSize, maxFontSize));
    }
  });

  canvas.renderAll();
}

/**
 * Suggests a ratio based on the slide type.
 */
export function getRecommendedRatio(slideType: 'cover' | 'content' | 'cta'): TypeScaleRatioKey {
  switch (slideType) {
    case 'cover': return 'perfect_fourth';
    case 'cta':   return 'major_third';
    default:      return 'minor_third';
  }
}

/**
 * Intelligent recommendation based on content density.
 */
export function recommendTypeScale(
  slideType: 'cover' | 'content' | 'cta',
  headlineLength: number = 0,
  hasBody: boolean = false,
  hasStat: boolean = false
): TypeScaleRatioKey {
  // Coalesce basic recommendation
  let ratio: TypeScaleRatioKey = getRecommendedRatio(slideType);

  // Adjust for density
  if (slideType === 'content') {
    if (headlineLength > 60 || (hasBody && hasStat)) {
      ratio = 'minor_third'; // Less dramatic for high density
    } else if (headlineLength < 30 && !hasBody) {
      ratio = 'major_third'; // More dramatic for low density
    }
  }

  return ratio;
}
