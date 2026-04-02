import type { FilterPreset } from '@/types/editor';

export const FILTER_PRESETS: FilterPreset[] = [
  { id: 'none',      label: 'None',      css: '' },
  { id: 'clarendon', label: 'Clarendon', css: 'contrast(1.2) saturate(1.35)' },
  { id: 'gingham',   label: 'Gingham',   css: 'brightness(1.05) hue-rotate(-10deg)' },
  { id: 'moon',      label: 'Moon',      css: 'grayscale(1) brightness(1.1) contrast(1.1)' },
  { id: 'lark',      label: 'Lark',      css: 'brightness(1.1) contrast(0.9) saturate(1.4)' },
  { id: 'reyes',     label: 'Reyes',     css: 'sepia(0.22) brightness(1.1) contrast(0.85) saturate(0.75)' },
  { id: 'juno',      label: 'Juno',      css: 'saturate(1.4) contrast(1.1)' },
  { id: 'slumber',   label: 'Slumber',   css: 'saturate(0.66) brightness(1.05)' },
  { id: 'crema',     label: 'Crema',     css: 'sepia(0.5) contrast(1.25) brightness(1.15) saturate(0.9)' },
  { id: 'ludwig',    label: 'Ludwig',    css: 'brightness(1.05) contrast(1.2) hue-rotate(-10deg)' },
  { id: 'aden',      label: 'Aden',      css: 'hue-rotate(-20deg) brightness(1.15) saturate(0.85) contrast(0.9)' },
  { id: 'perpetua',  label: 'Perpetua',  css: 'brightness(1.05) contrast(1.1) saturate(1.1)' },
];

export async function applyFilterToDataURL(
  dataURL: string,
  filterCSS: string
): Promise<string> {
  if (!filterCSS) return dataURL;

  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get 2D context'));
        return;
      }

      ctx.filter = filterCSS;
      ctx.drawImage(img, 0, 0);

      resolve(canvas.toDataURL('image/png', 1.0));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataURL;
  });
}
