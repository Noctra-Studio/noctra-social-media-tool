import { 
  Textbox, 
  Shadow, 
  Gradient, 
  type Canvas 
} from "fabric";

export type TextStyle = {
  id: string;
  name: string;
  createdAt: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;    // '400' | '500' | '700' | '900'
  fontStyle: string;     // 'normal' | 'italic'
  fill: string;          // hex color
  charSpacing: number;
  lineHeight: number;
  textAlign: string;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  shadow: {
    enabled: boolean;
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  } | null;
  stroke: {
    enabled: boolean;
    color: string;
    width: number;
  } | null;
  gradientFill: {
    enabled: boolean;
    color1: string;
    color2: string;
    angle: number;
  } | null;
};

export const TEXT_STYLES_STORAGE_KEY = 'noctra_text_styles';

export const DEFAULT_TEXT_STYLES: TextStyle[] = [
  {
    id: 'default-titular-noctra',
    name: 'Titular Noctra',
    createdAt: 0,
    fontFamily: 'Satoshi', 
    fontWeight: '900', 
    fontSize: 88,
    fontStyle: 'normal',
    fill: '#E0E5EB', 
    charSpacing: -30, 
    lineHeight: 1.1,
    textAlign: 'left',
    textTransform: 'none', 
    shadow: null, 
    stroke: null,
    gradientFill: null
  },
  {
    id: 'default-body-claro',
    name: 'Body Claro',
    createdAt: 0,
    fontFamily: 'Inter', 
    fontWeight: '400', 
    fontSize: 36,
    fontStyle: 'normal',
    fill: 'rgba(224,229,235,0.7)', 
    charSpacing: 0, 
    lineHeight: 1.6,
    textAlign: 'left',
    textTransform: 'none',
    shadow: null, 
    stroke: null,
    gradientFill: null
  },
  {
    id: 'default-eyebrow',
    name: 'Eyebrow',
    createdAt: 0,
    fontFamily: 'Inter', 
    fontWeight: '500', 
    fontSize: 22,
    fontStyle: 'normal',
    fill: '#4E576A', 
    charSpacing: 200, 
    lineHeight: 1,
    textAlign: 'left',
    textTransform: 'uppercase', 
    shadow: null, 
    stroke: null,
    gradientFill: null
  },
  {
    id: 'default-stat-gigante',
    name: 'Stat Gigante',
    createdAt: 0,
    fontFamily: 'Satoshi', 
    fontWeight: '900', 
    fontSize: 320,
    fontStyle: 'normal',
    fill: '#E0E5EB', 
    charSpacing: -60, 
    lineHeight: 1.0,
    textAlign: 'center',
    textTransform: 'none',
    shadow: null, 
    stroke: null,
    gradientFill: null
  },
  {
    id: 'default-acento-purple',
    name: 'Acento Purple',
    createdAt: 0,
    fontFamily: 'Satoshi', 
    fontWeight: '700', 
    fontSize: 64,
    fontStyle: 'normal',
    fill: '#E0E5EB',
    charSpacing: -20, 
    lineHeight: 1.15,
    textAlign: 'left',
    textTransform: 'none',
    shadow: { 
      enabled: true,
      color: 'rgba(70,45,110,0.4)', 
      blur: 20, 
      offsetX: 0, 
      offsetY: 4 
    },
    stroke: null,
    gradientFill: { 
      enabled: true,
      color1: '#8b5cf6', 
      color2: '#462D6E', 
      angle: 135 
    }
  }
];

export function getTextStyles(): TextStyle[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(TEXT_STYLES_STORAGE_KEY);
  if (!saved) return [];
  try {
    return JSON.parse(saved) as TextStyle[];
  } catch {
    return [];
  }
}

export function saveTextStyle(style: TextStyle) {
  const current = getTextStyles();
  const next = [style, ...current.filter(s => s.id !== style.id)].slice(0, 20);
  localStorage.setItem(TEXT_STYLES_STORAGE_KEY, JSON.stringify(next));
}

export function deleteTextStyle(id: string) {
  const current = getTextStyles();
  localStorage.setItem(TEXT_STYLES_STORAGE_KEY, JSON.stringify(current.filter(s => s.id !== id)));
}

export function applyTextStyle(
  obj: Textbox,
  style: TextStyle,
  canvas: Canvas
): void {
  // 1. Basic properties
  obj.set({
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    charSpacing: style.charSpacing,
    lineHeight: style.lineHeight,
    textAlign: (style as any).textAlign || 'left',
  });

  // 2. Text transform
  const data = (obj as any).data || {};
  if (!data.originalText) {
    data.originalText = obj.text;
  }
  
  let nextText = data.originalText;
  if (style.textTransform === 'uppercase') nextText = nextText.toUpperCase();
  if (style.textTransform === 'lowercase') nextText = nextText.toLowerCase();
  if (style.textTransform === 'capitalize') nextText = nextText.replace(/\b\w/g, (c: string) => c.toUpperCase());
  
  obj.set({
    text: nextText,
    data: { ...data, textTransform: style.textTransform }
  });

  // 3. Fill / Gradient
  if (style.gradientFill?.enabled) {
    const angle = style.gradientFill.angle;
    const rad = (angle * Math.PI) / 180;
    const x1 = 0.5 - Math.cos(rad) * 0.5;
    const y1 = 0.5 - Math.sin(rad) * 0.5;
    const x2 = 0.5 + Math.cos(rad) * 0.5;
    const y2 = 0.5 + Math.sin(rad) * 0.5;

    const gradient = new Gradient({
      type: "linear",
      gradientUnits: "percentage",
      coords: { x1, y1, x2, y2 },
      colorStops: [
        { offset: 0, color: style.gradientFill.color1 },
        { offset: 1, color: style.gradientFill.color2 },
      ],
    } as any);

    obj.set("fill", gradient);
    (obj as any).set("data", {
      ...(obj as any).data,
      gradientFill: { 
        color1: style.gradientFill.color1, 
        color2: style.gradientFill.color2, 
        angle 
      }
    });
  } else {
    obj.set('fill', style.fill);
    (obj as any).set("data", { ...(obj as any).data, gradientFill: null });
  }

  // 4. Shadow
  if (style.shadow?.enabled) {
    obj.set("shadow", new Shadow({
      color: style.shadow.color,
      blur: style.shadow.blur,
      offsetX: style.shadow.offsetX,
      offsetY: style.shadow.offsetY,
    }));
  } else {
    obj.set("shadow", null);
  }

  // 5. Stroke
  if (style.stroke?.enabled) {
    obj.set({
      stroke: style.stroke.color,
      strokeWidth: style.stroke.width,
    });
  } else {
    obj.set({
      stroke: "transparent",
      strokeWidth: 0,
    });
  }

  canvas.renderAll();
}
