import { 
  Textbox, 
  Group, 
  FabricText, 
  Gradient, 
  type FabricObject,
  type TextboxProps,
  type GradientOptions
} from 'fabric';

/**
 * Text Effects Library for Fabric.js v6
 */

// Override _renderChar to support Gradient Stroke
const originalRenderChar = Textbox.prototype._renderChar;

Textbox.prototype._renderChar = function(
  method: 'fillText' | 'strokeText',
  ctx: CanvasRenderingContext2D,
  lineIndex: number,
  charIndex: number,
  char: string,
  left: number,
  top: number
) {
  const data = (this as any).data;
  
  if (method === 'strokeText' && data?.gradientStroke?.enabled) {
    const { color1, color2, angle } = data.gradientStroke;
    
    // Create a local gradient for the character or use a shared one
    const rad = (angle * Math.PI) / 180;
    const x1 = -Math.cos(rad) * (this.width / 2);
    const y1 = -Math.sin(rad) * (this.height / 2);
    const x2 = Math.cos(rad) * (this.width / 2);
    const y2 = Math.sin(rad) * (this.height / 2);

    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);
    
    ctx.strokeStyle = grad;
  }
  
  return originalRenderChar.call(this, method, ctx, lineIndex, charIndex, char, left, top);
};

export interface ArcOptions {
  radius: number;
  startAngle: number; // in degrees
  endAngle: number;   // in degrees
  fontSize: number;
  fontFamily: string;
  fill: string | Gradient<'linear'> | Gradient<'radial'>;
  fontWeight?: string | number;
  fontStyle?: string;
}

/**
 * Creates a group of characters along an arc
 */
export function makeTextOnArc(text: string, options: ArcOptions): Group {
  const { radius, startAngle, endAngle, fontSize, fontFamily, fill, fontWeight, fontStyle } = options;
  const chars: FabricText[] = [];
  
  const span = endAngle - startAngle;
  const step = span / (text.length > 1 ? text.length - 1 : 1);

  for (let i = 0; i < text.length; i++) {
    const charAngle = startAngle + (i * step);
    const rad = (charAngle * Math.PI) / 180;
    
    const x = radius * Math.cos(rad);
    const y = radius * Math.sin(rad);
    
    const charObj = new FabricText(text[i], {
      left: x,
      top: y,
      angle: charAngle + 90, // Orient characters perpendicularly to the radius
      originX: 'center',
      originY: 'center',
      fontSize,
      fontFamily,
      fill,
      fontWeight,
      fontStyle,
    });
    
    chars.push(charObj);
  }

  const group = new Group(chars, {
    originX: 'center',
    originY: 'center',
  });

  (group as any).data = {
    type: 'arc-text',
    originalText: text,
    arcOptions: { radius, startAngle, endAngle }
  };

  return group;
}

/**
 * Creates a group of characters along a full circle
 */
export function makeTextOnCircle(text: string, options: Omit<ArcOptions, 'endAngle'>): Group {
  return makeTextOnArc(text, {
    ...options,
    endAngle: options.startAngle + 360
  });
}
