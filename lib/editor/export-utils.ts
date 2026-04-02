import type { Canvas } from 'fabric';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

import type { ExportOptions } from '@/types/editor';
import type { CarouselEditorSlide } from '@/lib/instagram-carousel-editor';
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

export async function exportCanvasUHD(
  fabricCanvas: Canvas,
  options: ExportOptions = UHD_PRESET
): Promise<string> {
  let dataURL = fabricCanvas.toDataURL({
    format: options.format,
    quality: options.quality,
    multiplier: options.multiplier,
  });

  if (options.activeFilterCSS) {
    dataURL = await applyFilterToDataURL(dataURL, options.activeFilterCSS);
  }

  return dataURL;
}

export async function exportMultiPlatformZip(
  dataURLs: string[],
  slidesData: CarouselEditorSlide[],
  networkId: string
): Promise<void> {
  const zip = new JSZip();
  const imgFolder = zip.folder("images_uhd");
  const platformFolder = zip.folder("social_copy");

  // 1. Add Images
  for (const [index, dataURL] of dataURLs.entries()) {
    const base64Data = dataURL.replace(/^data:image\/(png|jpeg);base64,/, "");
    imgFolder?.file(`slide-${String(index + 1).padStart(2, '0')}.png`, base64Data, { base64: true });
  }

  // 2. Generate Platform Text (X / LinkedIn)
  let postContent = `NOCTRA STUDIO — CONTENIDO GENERADO\n`;
  postContent += `Handle: @noctra_studio\n`;
  postContent += `------------------------------------------\n\n`;

  slidesData.forEach((slide, i) => {
    postContent += `[Slide ${i + 1}]\n`;
    if (slide.originalData.headline) postContent += `TITULAR: ${slide.originalData.headline}\n`;
    if (slide.originalData.body) postContent += `CUERPO: ${slide.originalData.body}\n`;
    postContent += `\n`;
  });

  postContent += `\n------------------------------------------\n`;
  postContent += `Optimizado para Noctra Social Media Engine`;

  platformFolder?.file("post_copy_paste.txt", postContent);

  // 3. Generate and Save ZIP
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `noctra-bundle-${networkId}.zip`);
}

export async function exportCarouselUHD(
  slides: Canvas[],
  networkId: string,
  options: ExportOptions = UHD_PRESET
): Promise<void> {
  for (const [index, slide] of slides.entries()) {
    const dataURL = await exportCanvasUHD(slide, {
      ...options,
      filename: `noctra-${networkId}-slide-${String(index + 1).padStart(2, '0')}`,
    });
    
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `noctra-${networkId}-slide-${String(index + 1).padStart(2, '0')}.${options.format}`;
    link.click();
    
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
