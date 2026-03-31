import { StaticCanvas, FabricObject, Rect } from 'fabric';

export type PlatformPreset = 
  | 'instagram_post' 
  | 'instagram_portrait' 
  | 'instagram_story' 
  | 'linkedin_post' 
  | 'linkedin_story' 
  | 'x_post' 
  | 'square' 
  | 'custom';

export type PlatformDimensions = {
  width: number;
  height: number;
  label: string;
  ratio: string;
};

export const PLATFORM_PRESETS: Record<PlatformPreset, PlatformDimensions> = {
  instagram_post: { width: 1080, height: 1080, label: 'Instagram Post', ratio: '1:1' },
  instagram_portrait: { width: 1080, height: 1350, label: 'Instagram Portrait', ratio: '4:5' },
  instagram_story: { width: 1080, height: 1920, label: 'Instagram Story', ratio: '9:16' },
  linkedin_post: { width: 1200, height: 628, label: 'LinkedIn Post', ratio: '1.91:1' },
  linkedin_story: { width: 1080, height: 1920, label: 'LinkedIn Story', ratio: '9:16' },
  x_post: { width: 1600, height: 900, label: 'X Post', ratio: '16:9' },
  square: { width: 1080, height: 1080, label: 'Cuadrado', ratio: '1:1' },
  custom: { width: 1080, height: 1080, label: 'Personalizado', ratio: 'Varios' },
};

const BASE_SIZE = 1080;

/**
 * Resizes a canvas for a target platform, scaling content proportionally
 * and centering it safely. Background objects are expanded to cover the full target area.
 */
export async function resizeCanvasForPlatform(
  fabricJSON: string | Record<string, unknown>,
  targetWidth: number,
  targetHeight: number
): Promise<StaticCanvas> {
  // Create offscreen static canvas
  const canvas = new StaticCanvas(undefined, {
    width: targetWidth,
    height: targetHeight,
  });

  // Load the current slide JSON
  await canvas.loadFromJSON(fabricJSON);

  // Calculate scale to "Fit" the 1080x1080 square into the target
  // We want to avoid cropping, so we scale to the smaller constraint
  const scale = Math.min(targetWidth / BASE_SIZE, targetHeight / BASE_SIZE);
  
  // Offsets to center the content
  const offsetX = (targetWidth - BASE_SIZE * scale) / 2;
  const offsetY = (targetHeight - BASE_SIZE * scale) / 2;

  // Process all objects
  const objects = canvas.getObjects();
  
  for (const obj of objects) {
    const id = obj.get('id') as string;
    
    // Background exception: should cover the ENTIRE canvas instead of scaling/centering
    if (id === 'background-base' || id === 'background-overlay') {
      obj.set({
        left: 0,
        top: 0,
        width: targetWidth,
        height: targetHeight,
      });
      // Ensure they don't have scaleX/Y from previous operations
      obj.set({ scaleX: 1, scaleY: 1 });
      continue;
    }

    if (id === 'background-image') {
      const img = obj as any;
      const imgWidth = img.width || BASE_SIZE;
      const imgHeight = img.height || BASE_SIZE;
      
      // Calculate cover scale for the new dimensions
      const imgScale = Math.max(targetWidth / imgWidth, targetHeight / imgHeight);
      
      img.set({
        scaleX: imgScale,
        scaleY: imgScale,
        left: (targetWidth - imgWidth * imgScale) / 2,
        top: (targetHeight - imgHeight * imgScale) / 2,
      });
      continue;
    }

    // Default object scaling and positioning
    // 1. Scale relative to BASE_SIZE
    obj.scale(obj.scaleX * scale);
    
    // 2. Reposition relative to the center offsets
    obj.set({
      left: (obj.left ?? 0) * scale + offsetX,
      top: (obj.top ?? 0) * scale + offsetY,
    });
    
    obj.setCoords();
  }

  canvas.renderAll();
  return canvas;
}
