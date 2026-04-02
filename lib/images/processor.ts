import sharp from 'sharp';

export type ProcessingStyle = 'dark-minimal' | 'editorial' | 'tech' | 'warm' | 'clean-bright' | 'default';

export type ImageProcessingOptions = {
  slideType?: 'cover' | 'content' | 'cta';
  mood?: string;
  style?: ProcessingStyle;
  targetWidth?: number;
  targetHeight?: number;
  quality?: number;
};

export type ProcessedImage = {
  data: Buffer;
  dataUrl: string;
  dominantColor: string;
  palette: string[];
  focalPoint: { x: number; y: number };
  processingApplied: string;
};

export function moodToStyle(mood?: string): ProcessingStyle {
  const valid: ProcessingStyle[] = ['dark-minimal', 'editorial', 'tech', 'warm', 'clean-bright'];
  if (mood && valid.includes(mood as ProcessingStyle)) {
    return mood as ProcessingStyle;
  }
  return 'dark-minimal';
}

export async function processImageForSlide(
  input: string | Buffer,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  const {
    targetWidth = 1080,
    targetHeight = 1080,
    style,
    mood = 'dark-minimal',
    quality = 85,
  } = options;

  const activeStyle: ProcessingStyle = style || moodToStyle(mood);
  
  let inputBuffer: Buffer;
  
  if (Buffer.isBuffer(input)) {
    inputBuffer = input;
  } else {
    const response = await fetch(input);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    inputBuffer = Buffer.from(arrayBuffer);
  }

  let pipeline = sharp(inputBuffer).resize(targetWidth, targetHeight, {
    fit: 'cover',
    position: 'center',
  });

  switch (activeStyle) {
    case 'dark-minimal':
      pipeline = pipeline
        .modulate({ brightness: 0.85, saturation: 0.9 })
        .tint({ r: 20, g: 20, b: 25 });
      break;
    case 'editorial':
      pipeline = pipeline
        .grayscale()
        .modulate({ brightness: 0.9 })
        .linear(1.1);
      break;
    case 'tech':
      pipeline = pipeline
        .modulate({ brightness: 0.8, saturation: 1.1 })
        .tint({ r: 0, g: 30, b: 60 });
      break;
    case 'warm':
      pipeline = pipeline
        .modulate({ brightness: 0.9, saturation: 1.15 })
        .tint({ r: 60, g: 30, b: 0 });
      break;
    case 'clean-bright':
      pipeline = pipeline
        .modulate({ brightness: 1.05, saturation: 0.95 })
        .linear(1.05);
      break;
    default:
      pipeline = pipeline.modulate({ brightness: 0.9 });
      break;
  }

  const outputBuffer = await pipeline.webp({ quality }).toBuffer();

  // Extract color info from the original (unprocessed) image
  const { dominant, channels } = await sharp(inputBuffer)
    .resize(100, 100, { fit: 'cover' })
    .raw()
    .toBuffer({ resolveWithObject: true })
    .then(({ data, info }) => {
      let r = 0, g = 0, b = 0;
      const pixels = info.width * info.height;
      for (let i = 0; i < data.length; i += info.channels) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }
      r = Math.round(r / pixels);
      g = Math.round(g / pixels);
      b = Math.round(b / pixels);
      const toHex = (v: number) => v.toString(16).padStart(2, '0');
      return {
        dominant: `#${toHex(r)}${toHex(g)}${toHex(b)}`,
        channels: { r, g, b },
      };
    });

  // Simple palette: dominant + light/dark variants
  const lighten = (v: number) => Math.min(255, Math.round(v * 1.4));
  const darken = (v: number) => Math.round(v * 0.6);
  const toHex = (v: number) => v.toString(16).padStart(2, '0');
  const palette = [
    dominant,
    `#${toHex(lighten(channels.r))}${toHex(lighten(channels.g))}${toHex(lighten(channels.b))}`,
    `#${toHex(darken(channels.r))}${toHex(darken(channels.g))}${toHex(darken(channels.b))}`,
  ];

  const dataUrl = `data:image/webp;base64,${outputBuffer.toString('base64')}`;

  return {
    data: outputBuffer,
    dataUrl,
    dominantColor: dominant,
    palette,
    focalPoint: { x: 0.5, y: 0.5 },
    processingApplied: activeStyle,
  };
}
