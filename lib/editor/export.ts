import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { StaticCanvas } from 'fabric';
import { resizeCanvasForPlatform, type PlatformDimensions } from './resize-canvas';
import type { CarouselEditorSlide } from '@/lib/instagram-carousel-editor';

export type ExportFormat = 'png' | 'jpg' | 'svg';
export type ExportResolution = 1 | 2 | 3;

export type ExportConfig = {
  slides: CarouselEditorSlide[];
  selectedIndices: number[];
  format: ExportFormat;
  resolution: ExportResolution;
  quality: number; // 0-1, specifically for JPG
  platform: PlatformDimensions;
  filename: string;
  onProgress?: (current: number, total: number, message: string) => void;
};

/**
 * Core export engine that processes slides into a ZIP package or single file.
 */
export async function exportSlides(config: ExportConfig): Promise<Blob> {
  const { 
    slides, 
    selectedIndices, 
    format, 
    resolution, 
    quality, 
    platform, 
    filename, 
    onProgress 
  } = config;

  const zip = new JSZip();
  const selectedSlides = slides.filter((_, i) => selectedIndices.includes(i));
  const total = selectedSlides.length;

  for (let i = 0; i < total; i++) {
    const slide = selectedSlides[i];
    const slideIndex = selectedIndices[i] + 1;
    const slideLabel = String(slideIndex).padStart(2, '0');
    
    if (onProgress) {
      onProgress(i + 1, total, `Procesando slide ${i + 1} de ${total}...`);
    }

    try {
      // 1. Initialize canvas with resizing logic
      // fabricJSON can be a string or a parsed object
      const json = slide.fabricJSON || JSON.stringify({ objects: [] });
      const canvas = await resizeCanvasForPlatform(json, platform.width, platform.height);

      // 2. Apply resolution multiplier
      // Zoom the canvas to reflect high resolution
      canvas.setZoom(resolution);
      canvas.setDimensions({
        width: platform.width * resolution,
        height: platform.height * resolution
      });

      // 3. Export specific format
      let data: string | Blob;
      const fileExt = format === 'jpg' ? 'jpg' : format;

      if (format === 'svg') {
        data = canvas.toSVG();
        zip.file(`${filename}-${slideLabel}.svg`, data);
      } else {
        const dataURL = canvas.toDataURL({
          format: format === 'jpg' ? 'jpeg' : 'png',
          multiplier: 1, // Already zoomed manually for better control
          quality: format === 'jpg' ? quality : 1,
        });

        // Convert dataURL to Blob for JSZip
        const base64Data = dataURL.split(',')[1];
        zip.file(`${filename}-${slideLabel}.${fileExt}`, base64Data, { base64: true });
      }

      // 4. Memory management: dispose the offscreen canvas
      canvas.dispose();
    } catch (error) {
      console.error(`Error exporting slide ${slideIndex}:`, error);
    }
  }

  if (onProgress) {
    onProgress(total, total, "Generando archivo ZIP...");
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return zipBlob;
}

/**
 * Quick export for the current slide.
 */
export async function quickExportCurrentSlide(
  slide: CarouselEditorSlide,
  filename: string
) {
  const json = slide.fabricJSON || JSON.stringify({ objects: [] });
  
  // Quick export at 2x square quality
  const canvas = await resizeCanvasForPlatform(json, 1080, 1080);
  
  // Set dimensions for 2x
  canvas.setZoom(2);
  canvas.setDimensions({ width: 2160, height: 2160 });

  const dataURL = canvas.toDataURL({
    format: 'png',
    multiplier: 1,
  });

  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = dataURL;
  link.click();

  canvas.dispose();
}
