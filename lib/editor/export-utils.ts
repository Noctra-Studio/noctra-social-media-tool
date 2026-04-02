import type { Canvas } from 'fabric';

import type { ExportOptions } from '@/types/editor';

import { applyFilterToDataURL } from './filter-presets';

type CanvasSize = {
  width: number;
  height: number;
};

export const UHD_PRESET: ExportOptions = {
  format: 'png',
  multiplier: 4,
  quality: 1.0,
  filename: 'noctra-post',
  activeFilterCSS: '',
};

export const HD_PRESET: ExportOptions = {
  format: 'png',
  multiplier: 2,
  quality: 1.0,
  filename: 'noctra-post',
  activeFilterCSS: '',
};

export async function exportCanvasUHD(
  fabricCanvas: Canvas,
  options: ExportOptions = UHD_PRESET
): Promise<void> {
  let dataURL = fabricCanvas.toDataURL({
    format: options.format,
    quality: options.quality,
    multiplier: options.multiplier,
  });

  if (options.activeFilterCSS) {
    dataURL = await applyFilterToDataURL(dataURL, options.activeFilterCSS);
  }

  const finalWidth = fabricCanvas.getWidth() * options.multiplier;
  const finalHeight = fabricCanvas.getHeight() * options.multiplier;
  const filename = `${options.filename}-${finalWidth}x${finalHeight}.${options.format}`;

  const link = document.createElement('a');
  link.href = dataURL;
  link.download = filename;
  link.click();
}

export async function exportCarouselUHD(
  slides: Canvas[],
  networkId: string,
  options: ExportOptions = UHD_PRESET
): Promise<void> {
  for (const [index, slide] of slides.entries()) {
    const slideOptions: ExportOptions = {
      ...options,
      filename: `noctra-${networkId}-slide-${String(index + 1).padStart(2, '0')}`,
    };

    await exportCanvasUHD(slide, slideOptions);
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
}

export function getExportDimensions(
  canvasSize: CanvasSize,
  multiplier: ExportOptions['multiplier']
): { width: number; height: number; megapixels: number } {
  const width = canvasSize.width * multiplier;
  const height = canvasSize.height * multiplier;

  return {
    width,
    height,
    megapixels: parseFloat(((width * height) / 1_000_000).toFixed(1)),
  };
}

export function getExportLabel(multiplier: ExportOptions['multiplier']): string {
  switch (multiplier) {
    case 2:
      return 'HD (2x)';
    case 3:
      return '3K (3x)';
    case 4:
      return 'UHD (4x) — Recomendado';
  }
}
