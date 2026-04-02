import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { StaticCanvas } from 'fabric';
import { resizeCanvasForPlatform, type PlatformDimensions } from './resize-canvas';
import { extractSlideData, canUseOGRender, type SlideRenderData } from './extract-slide-data';
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
  activeFilterCSS?: string;
  onProgress?: (current: number, total: number, message: string) => void;
};

async function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Failed to convert blob to data URL'));
    };
    reader.onerror = () => reject(new Error('Failed to read blob as data URL'));
    reader.readAsDataURL(blob);
  });
}

async function applyFilterToExportDataURL(
  dataURL: string,
  filterCSS: string,
  mimeType: 'image/jpeg' | 'image/png',
  quality: number
): Promise<string> {
  if (!filterCSS) {
    return dataURL;
  }

  return new Promise((resolve, reject) => {
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
      resolve(canvas.toDataURL(mimeType, quality));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataURL;
  });
}

/**
 * Calls the Vercel OG edge route to render a slide server-side.
 * Returns a PNG Blob. Throws on HTTP or JSON error.
 */
export async function exportSlideWithOG(
  slideData: SlideRenderData,
  scale: ExportResolution
): Promise<Blob> {
  const res = await fetch('/api/export/render', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slideData, scale }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? 'OG render failed')
  }

  return res.blob()
}

/**
 * Core export engine that processes slides into a ZIP package or single file.
 * Uses Vercel OG (satori) for PNG exports when the slide is OG-compatible,
 * falling back to canvas.toDataURL() for JPEG/SVG and unsupported features.
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
    activeFilterCSS = '',
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
      const json = slide.fabricJSON || JSON.stringify({ objects: [] });
      const canvas = await resizeCanvasForPlatform(json, platform.width, platform.height);

      if (format === 'svg') {
        // SVG: always use Fabric's native export
        const data = canvas.toSVG();
        zip.file(`${filename}-${slideLabel}.svg`, data);
        canvas.dispose();
        continue;
      }

      if (format === 'png') {
        // Attempt Vercel OG render (sequential — OG is memory-intensive)
        try {
          const slideData = extractSlideData(canvas)
          if (canUseOGRender(slideData)) {
            const blob = await exportSlideWithOG(slideData, resolution)
            if (activeFilterCSS) {
              const filteredDataURL = await applyFilterToExportDataURL(
                await blobToDataURL(blob),
                activeFilterCSS,
                'image/png',
                1
              )
              zip.file(`${filename}-${slideLabel}.png`, filteredDataURL.split(',')[1], { base64: true })
            } else {
              const arrayBuffer = await blob.arrayBuffer()
              zip.file(`${filename}-${slideLabel}.png`, arrayBuffer)
            }
            canvas.dispose()
            continue
          }
        } catch (ogErr) {
          console.warn(`[export] OG render failed for slide ${slideIndex}, falling back to canvas:`, ogErr)
        }
      }

      // Fallback: canvas.toDataURL (used for JPG, SVG-fallback, and OG-incompatible slides)
      canvas.setZoom(resolution);
      canvas.setDimensions({
        width: platform.width * resolution,
        height: platform.height * resolution
      });

      let dataURL = canvas.toDataURL({
        format: format === 'jpg' ? 'jpeg' : 'png',
        multiplier: 1,
        quality: format === 'jpg' ? quality : 1,
      });

      dataURL = await applyFilterToExportDataURL(
        dataURL,
        activeFilterCSS,
        format === 'jpg' ? 'image/jpeg' : 'image/png',
        format === 'jpg' ? quality : 1
      )

      const base64Data = dataURL.split(',')[1];
      zip.file(`${filename}-${slideLabel}.${format === 'jpg' ? 'jpg' : 'png'}`, base64Data, { base64: true });
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
  filename: string,
  activeFilterCSS = ''
) {
  const json = slide.fabricJSON || JSON.stringify({ objects: [] });
  const canvas = await resizeCanvasForPlatform(json, 1080, 1080);

  // Try OG render at 2x first
  try {
    const slideData = extractSlideData(canvas)
    if (canUseOGRender(slideData)) {
      const blob = await exportSlideWithOG(slideData, 2)
      const url = activeFilterCSS
        ? await applyFilterToExportDataURL(
            await blobToDataURL(blob),
            activeFilterCSS,
            'image/png',
            1
          )
        : URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `${filename}.png`
      link.href = url
      link.click()
      if (!activeFilterCSS) {
        URL.revokeObjectURL(url)
      }
      canvas.dispose()
      return
    }
  } catch {
    // fall through to canvas export
  }

  canvas.setZoom(2);
  canvas.setDimensions({ width: 2160, height: 2160 });

  const dataURL = await applyFilterToExportDataURL(
    canvas.toDataURL({ format: 'png', multiplier: 1 }),
    activeFilterCSS,
    'image/png',
    1
  );
  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = dataURL;
  link.click();

  canvas.dispose();
}
