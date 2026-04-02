import { 
  Canvas, 
  FabricImage, 
  Rect, 
  util, 
  type FabricObject 
} from 'fabric';

/**
 * Native background management for Fabric.js canvas
 */

export interface BackgroundOptions {
  dimming?: number;       // 0-0.8 (0-80%)
  fit?: 'cover' | 'contain' | 'fill';
  animated?: boolean;     // 200ms fade transition
  slideType?: 'cover' | 'content' | 'cta';
  mood?: string;
  style?: string;
  metadata?: {
    photographer?: string;
    photographerUrl?: string;
    source?: 'unsplash' | 'pexels';
    sourceUrl?: string;
    id?: string;
  };
}

/**
 * Sets an image as the canvas background with proper scaling and optional effects.
 */
export async function setCanvasBackground(
  canvas: Canvas,
  imageUrl: string,
  options: BackgroundOptions = {}
): Promise<void> {
  const { dimming = 0, animated = true, slideType = 'content', mood = 'dark-minimal', style } = options;

  let finalImageUrl = imageUrl;
  let processingMetadata = {};

  // 1. Process if external URL and mood/style applied
  if (!imageUrl.startsWith('data:') && (mood !== 'natural' || style)) {
    const proxyUrl = new URL('/api/visual/process', window.location.origin);
    proxyUrl.searchParams.append('imageUrl', imageUrl);
    if (mood) proxyUrl.searchParams.append('mood', mood);
    if (style) proxyUrl.searchParams.append('style', style as string);
    proxyUrl.searchParams.append('slideType', slideType);
    
    finalImageUrl = proxyUrl.toString();
    processingMetadata = {
      processingApplied: [mood, style].filter(Boolean) as string[]
    };
  }

  return new Promise((resolve, reject) => {
    FabricImage.fromURL(finalImageUrl, {
      crossOrigin: 'anonymous',
    }).then((img) => {
      // 1. Calculate scale to COVER
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const scaleX = canvasWidth / img.width;
      const scaleY = canvasHeight / img.height;
      const scale = Math.max(scaleX, scaleY);

      img.set({
        scaleX: scale,
        scaleY: scale,
        originX: 'center',
        originY: 'center',
        left: canvasWidth / 2,
        top: canvasHeight / 2,
        selectable: false,
        evented: false,
      });

      // 2. Handle animation
      if (animated) {
        img.set('opacity', 0);
        canvas.backgroundImage = img;
        
        util.animate({
          startValue: 0,
          endValue: 1,
          duration: 200,
          onChange: (v) => {
            img.set('opacity', v);
            canvas.renderAll();
          },
          onComplete: () => {
            updateDimmingOverlay(canvas, dimming);
            resolve();
          }
        });
      } else {
        canvas.backgroundImage = img;
        updateDimmingOverlay(canvas, dimming);
        canvas.renderAll();
        resolve();
      }

      // 3. Store metadata
      (canvas as any).data = {
        ...(canvas as any).data,
        backgroundImage: {
          url: imageUrl, // store original URL
          processedUrl: finalImageUrl,
          dimming: dimming,
          unsplashId: options.metadata?.source === 'unsplash' ? options.metadata.id : (extractUnsplashId(imageUrl) || undefined),
          ...options.metadata,
          ...processingMetadata
        }
      };

    }).catch(err => {
      console.error('Failed to load background image:', err);
      reject(err);
    });
  });
}

/**
 * Removes the background image and dimming overlay.
 */
export function removeCanvasBackground(canvas: Canvas): void {
  canvas.backgroundImage = undefined;
  
  // Find and remove dimming overlay
  const dimmingRect = canvas.getObjects().find(o => (o as any).data?.role === 'bg-dimming');
  if (dimmingRect) {
    canvas.remove(dimmingRect);
  }

  (canvas as any).data = {
    ...(canvas as any).data,
    backgroundImage: null
  };

  canvas.renderAll();
}

/**
 * Updates or creates the dimming overlay rect.
 * Positions it above the background but below main content.
 */
export function updateDimmingOverlay(canvas: Canvas, opacity: number): void {
  let dimmingRect = canvas.getObjects().find(o => (o as any).data?.role === 'bg-dimming') as Rect | undefined;

  if (opacity <= 0) {
    if (dimmingRect) canvas.remove(dimmingRect);
    return;
  }

  if (!dimmingRect) {
    dimmingRect = new Rect({
      width: canvas.width,
      height: canvas.height,
      left: 0,
      top: 0,
      fill: `rgba(0,0,0,${opacity})`,
      selectable: false,
      evented: false,
      data: { role: 'bg-dimming' }
    });
    canvas.add(dimmingRect);
    // Send to back, but above background image (which is not in getObjects())
    // canvas.sendObjectToBack(dimmingRect) will put it below everything currently in the pool.
    canvas.sendObjectToBack(dimmingRect); 
  } else {
    dimmingRect.set('fill', `rgba(0,0,0,${opacity})`);
  }

  canvas.renderAll();
}

/**
 * Helper to extract Unsplash ID from standard Unsplash URLs
 */
function extractUnsplashId(url: string): string | null {
  try {
    const regex = /photo-([a-zA-Z0-9-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
