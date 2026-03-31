export type TemplateRole =
  | 'headline'
  | 'body'
  | 'eyebrow'
  | 'counter'
  | 'decorator'
  | 'logo'
  | 'stat'
  | 'handle'

export type TemplateObject = {
  type: 'textbox' | 'rect' | 'line' | 'circle' | 'path'
  role: TemplateRole
  props: Record<string, unknown>
}

export type SlideTemplate = {
  id: string
  name: string
  description: string
  thumbnail: string // CSS gradient or color for preview
  applicableTo: ('cover' | 'content' | 'cta')[]
  objects: TemplateObject[]
  canvasBackground: {
    type: 'solid' | 'gradient'
    default: string // hex or gradient CSS
  }
}

export const templates: Record<string, SlideTemplate> = {
  editorial: {
    id: 'editorial',
    name: 'Editorial',
    description: 'Número decorativo grande, texto bottom-left',
    thumbnail: 'linear-gradient(135deg, #462D6E 0%, #101417 100%)',
    applicableTo: ['cover', 'content'],
    canvasBackground: {
      type: 'solid',
      default: '#101417',
    },
    objects: [
      {
        type: 'textbox',
        role: 'counter',
        props: {
          text: '01',
          left: 60,
          top: 40,
          width: 400,
          fontSize: 280,
          fontFamily: 'Satoshi',
          fontWeight: '900',
          fill: 'rgba(255,255,255,0.04)',
          selectable: true,
          evented: true,
        },
      },
      {
        type: 'line',
        role: 'decorator',
        props: {
          x1: 60,
          y1: 680,
          x2: 340,
          y2: 680,
          stroke: '#462D6E',
          strokeWidth: 2,
          selectable: true,
        },
      },
      {
        type: 'textbox',
        role: 'eyebrow',
        props: {
          text: 'CATEGORÍA',
          left: 60,
          top: 700,
          width: 500,
          fontSize: 22,
          fontFamily: 'Inter',
          fontWeight: '500',
          fill: '#4E576A',
          charSpacing: 200,
        },
      },
      {
        type: 'textbox',
        role: 'headline',
        props: {
          text: 'Titular del slide',
          left: 60,
          top: 740,
          width: 900,
          fontSize: 88,
          fontFamily: 'Satoshi',
          fontWeight: '900',
          fill: '#E0E5EB',
          lineHeight: 1.1,
          charSpacing: -30,
        },
      },
      {
        type: 'textbox',
        role: 'body',
        props: {
          text: 'Texto de apoyo aquí.',
          left: 60,
          top: 960,
          width: 700,
          fontSize: 32,
          fontFamily: 'Inter',
          fontWeight: '400',
          fill: 'rgba(224,229,235,0.65)',
          lineHeight: 1.5,
        },
      },
      {
        type: 'textbox',
        role: 'logo',
        props: {
          text: '◐',
          left: 990,
          top: 1020,
          width: 60,
          fontSize: 40,
          fill: 'rgba(255,255,255,0.5)',
          textAlign: 'right',
        },
      },
    ],
  },
  'bold-statement': {
    id: 'bold-statement',
    name: 'Bold Statement',
    description: 'Texto gigante, máximo impacto, mínimos elementos',
    thumbnail: 'linear-gradient(135deg, #101417 0%, #212631 100%)',
    applicableTo: ['cover', 'cta'],
    canvasBackground: {
      type: 'solid',
      default: '#101417',
    },
    objects: [
      {
        type: 'textbox',
        role: 'headline',
        props: {
          text: 'Titular impactante',
          left: 60,
          top: 120,
          width: 960,
          fontSize: 140,
          fontFamily: 'Satoshi',
          fontWeight: '900',
          fill: '#E0E5EB',
          lineHeight: 1.0,
          charSpacing: -50,
        },
      },
      {
        type: 'rect',
        role: 'decorator',
        props: {
          left: 60,
          top: 820,
          width: 80,
          height: 3,
          fill: '#462D6E',
          rx: 2,
        },
      },
      {
        type: 'textbox',
        role: 'body',
        props: {
          text: 'Contexto breve.',
          left: 60,
          top: 850,
          width: 700,
          fontSize: 36,
          fontFamily: 'Inter',
          fontWeight: '400',
          fill: '#4E576A',
          lineHeight: 1.5,
        },
      },
      {
        type: 'textbox',
        role: 'handle',
        props: {
          text: '@noctra.studio',
          left: 60,
          top: 1020,
          width: 960,
          fontSize: 24,
          fontFamily: 'Inter',
          fontWeight: '400',
          fill: '#4E576A',
          textAlign: 'right',
        },
      },
    ],
  },
  split: {
    id: 'split',
    name: 'Split',
    description: 'División 50/50, color en un lado, texto en otro',
    thumbnail: 'linear-gradient(90deg, #462D6E 50%, #101417 50%)',
    applicableTo: ['cover', 'content'],
    canvasBackground: {
      type: 'solid',
      default: '#101417',
    },
    objects: [
      {
        type: 'rect',
        role: 'decorator',
        props: {
          left: 0,
          top: 0,
          width: 480,
          height: 1080,
          fill: '#462D6E',
          selectable: true,
        },
      },
      {
        type: 'textbox',
        role: 'eyebrow',
        props: {
          text: 'NOCTRA',
          left: 40,
          top: 500,
          width: 300,
          fontSize: 24,
          fontFamily: 'Inter',
          fontWeight: '500',
          fill: 'rgba(255,255,255,0.3)',
          charSpacing: 300,
          angle: -90,
        },
      },
      {
        type: 'textbox',
        role: 'headline',
        props: {
          text: 'Titular',
          left: 540,
          top: 200,
          width: 480,
          fontSize: 100,
          fontFamily: 'Satoshi',
          fontWeight: '900',
          fill: '#E0E5EB',
          lineHeight: 1.1,
        },
      },
      {
        type: 'textbox',
        role: 'body',
        props: {
          text: 'Descripción del contenido.',
          left: 540,
          top: 680,
          width: 460,
          fontSize: 32,
          fontFamily: 'Inter',
          fontWeight: '400',
          fill: 'rgba(224,229,235,0.7)',
          lineHeight: 1.55,
        },
      },
    ],
  },
  list: {
    id: 'list',
    name: 'Lista',
    description: 'Items numerados con espacio visual entre cada uno',
    thumbnail: '#101417',
    applicableTo: ['content'],
    canvasBackground: {
      type: 'solid',
      default: '#101417',
    },
    objects: [
      {
        type: 'textbox',
        role: 'headline',
        props: {
          text: 'Título del listado',
          left: 60,
          top: 60,
          width: 960,
          fontSize: 64,
          fontFamily: 'Satoshi',
          fontWeight: '700',
          fill: '#E0E5EB',
          lineHeight: 1.15,
        },
      },
      {
        type: 'line',
        role: 'decorator',
        props: {
          x1: 60,
          y1: 220,
          x2: 1020,
          y2: 220,
          stroke: '#2a3040',
          strokeWidth: 1,
        },
      },
      {
        type: 'textbox',
        role: 'counter',
        props: {
          text: '01',
          left: 60,
          top: 260,
          width: 100,
          fontSize: 52,
          fontFamily: 'Satoshi',
          fontWeight: '900',
          fill: '#462D6E',
        },
      },
      {
        type: 'textbox',
        role: 'body',
        props: {
          text: 'Primer punto del listado',
          left: 180,
          top: 278,
          width: 840,
          fontSize: 38,
          fontFamily: 'Inter',
          fontWeight: '400',
          fill: '#E0E5EB',
          lineHeight: 1.4,
        },
      },
      {
        type: 'textbox',
        role: 'counter',
        props: {
          text: '02',
          left: 60,
          top: 420,
          width: 100,
          fontSize: 52,
          fontFamily: 'Satoshi',
          fontWeight: '900',
          fill: '#462D6E',
        },
      },
      {
        type: 'textbox',
        role: 'body',
        props: {
          text: 'Segundo punto',
          left: 180,
          top: 438,
          width: 840,
          fontSize: 38,
          fontFamily: 'Inter',
          fontWeight: '400',
          fill: '#E0E5EB',
          lineHeight: 1.4,
        },
      },
      {
        type: 'textbox',
        role: 'counter',
        props: {
          text: '03',
          left: 60,
          top: 580,
          width: 100,
          fontSize: 52,
          fontFamily: 'Satoshi',
          fontWeight: '900',
          fill: '#462D6E',
        },
      },
      {
        type: 'textbox',
        role: 'body',
        props: {
          text: 'Tercer punto',
          left: 180,
          top: 598,
          width: 840,
          fontSize: 38,
          fontFamily: 'Inter',
          fontWeight: '400',
          fill: '#E0E5EB',
          lineHeight: 1.4,
        },
      },
    ],
  },
  'stat-hero': {
    id: 'stat-hero',
    name: 'Stat Hero',
    description: 'Número grande como protagonista visual',
    thumbnail: 'linear-gradient(180deg, #462D6E 0%, #101417 100%)',
    applicableTo: ['cover', 'content'],
    canvasBackground: {
      type: 'solid',
      default: '#101417',
    },
    objects: [
      {
        type: 'textbox',
        role: 'stat',
        props: {
          text: '68%',
          left: 60,
          top: 140,
          width: 960,
          fontSize: 320,
          fontFamily: 'Satoshi',
          fontWeight: '900',
          fill: '#E0E5EB',
          lineHeight: 1.0,
          charSpacing: -60,
        },
      },
      {
        type: 'textbox',
        role: 'headline',
        props: {
          text: 'de los usuarios abandona',
          left: 60,
          top: 700,
          width: 900,
          fontSize: 52,
          fontFamily: 'Satoshi',
          fontWeight: '700',
          fill: '#E0E5EB',
          lineHeight: 1.2,
        },
      },
      {
        type: 'textbox',
        role: 'body',
        props: {
          text: 'si el sitio tarda más de 3 segundos.',
          left: 60,
          top: 860,
          width: 800,
          fontSize: 34,
          fontFamily: 'Inter',
          fontWeight: '400',
          fill: '#4E576A',
          lineHeight: 1.4,
        },
      },
      {
        type: 'circle',
        role: 'decorator',
        props: {
          left: 950,
          top: 160,
          radius: 18,
          fill: '#462D6E',
        },
      },
    ],
  },
  'minimal-quote': {
    id: 'minimal-quote',
    name: 'Minimal Quote',
    description: 'Solo texto centrado, mucho espacio negativo',
    thumbnail: '#101417',
    applicableTo: ['cover', 'cta', 'content'],
    canvasBackground: {
      type: 'solid',
      default: '#101417',
    },
    objects: [
      {
        type: 'textbox',
        role: 'decorator',
        props: {
          text: '"',
          left: 60,
          top: 120,
          width: 200,
          fontSize: 260,
          fontFamily: 'Satoshi',
          fontWeight: '900',
          fill: 'rgba(70,45,110,0.3)',
          lineHeight: 1,
        },
      },
      {
        type: 'textbox',
        role: 'headline',
        props: {
          text: 'La claridad no es un estilo. Es una decisión.',
          left: 80,
          top: 300,
          width: 920,
          fontSize: 72,
          fontFamily: 'Satoshi',
          fontWeight: '700',
          fill: '#E0E5EB',
          lineHeight: 1.2,
          fontStyle: 'italic',
        },
      },
      {
        type: 'textbox',
        role: 'body',
        props: {
          text: '— Noctra Studio',
          left: 80,
          top: 800,
          width: 920,
          fontSize: 28,
          fontFamily: 'Inter',
          fontWeight: '400',
          fill: '#4E576A',
          charSpacing: 100,
        },
      },
    ],
  },
}
