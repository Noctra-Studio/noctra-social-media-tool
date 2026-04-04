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
  category: 'Viral' | 'Educational' | 'Minimalist' | 'Tech' | 'Corporate' | 'Creative'
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
    name: 'Editorial Pro',
    description: 'Diseño clásico de revista con números gigantes y jerarquía clara.',
    category: 'Corporate',
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
          fontSize: 320,
          fontFamily: 'Satoshi',
          fontWeight: '900',
          fill: 'rgba(255,255,255,0.03)',
          selectable: false,
          evented: false,
        },
      },
      {
        type: 'line',
        role: 'decorator',
        props: {
          x1: 60,
          y1: 580,
          x2: 340,
          y2: 580,
          stroke: '#6C4CE4',
          strokeWidth: 3,
        },
      },

      {
        type: 'textbox',
        role: 'headline',
        props: {
          text: 'Titular de Alto Impacto',
          left: 60,
          top: 620,
          width: 920,
          fontSize: 92,
          fontFamily: 'Satoshi',
          fontWeight: '900',
          fill: '#F5F7FB',
          lineHeight: 1.05,
          charSpacing: -35,
        },
      },
      {
        type: 'textbox',
        role: 'body',
        props: {
          text: 'Este diseño está optimizado para legibilidad máxima en dispositivos móviles.',
          left: 60,
          top: 820,
          width: 750,
          fontSize: 34,
          fontFamily: 'Inter',
          fontWeight: '400',
          fill: 'rgba(245,247,251,0.7)',
          lineHeight: 1.5,
        },
      },
    ],
  },
  'dark-mono': {
    id: 'dark-mono',
    name: 'Dark Mono',
    description: 'Estética técnica y minimalista ideal para desarrolladores y SaaS.',
    category: 'Tech',
    thumbnail: 'linear-gradient(135deg, #050505 0%, #1A1A1A 100%)',
    applicableTo: ['cover', 'content', 'cta'],
    canvasBackground: {
      type: 'solid',
      default: '#0A0A0A',
    },
    objects: [
      {
        type: 'rect',
        role: 'decorator',
        props: {
          left: 0,
          top: 0,
          width: 1080,
          height: 1080,
          stroke: 'rgba(255,255,255,0.05)',
          strokeWidth: 40,
          fill: 'transparent',
          selectable: false,
        },
      },
      {
        type: 'textbox',
        role: 'headline',
        props: {
          text: '> SYSTEM_INITIALIZED',
          left: 80,
          top: 120,
          width: 920,
          fontSize: 110,
          fontFamily: 'JetBrains Mono, monospace',
          fontWeight: '800',
          fill: '#00FF41',
          lineHeight: 1.1,
        },
      },
      {
        type: 'textbox',
        role: 'body',
        props: {
          text: 'Optimización de procesos a través de código limpio y arquitectura escalable.',
          left: 80,
          top: 820,
          width: 800,
          fontSize: 32,
          fontFamily: 'JetBrains Mono, monospace',
          fontWeight: '400',
          fill: 'rgba(0,255,65,0.6)',
          lineHeight: 1.6,
        },
      },
    ],
  },
  'bold-statement': {
    id: 'bold-statement',
    name: 'Bold Impact',
    description: 'Tipografía gigante para mensajes que no pueden ser ignorados.',
    category: 'Viral',
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
          text: 'MENOS ES MAS',
          left: 60,
          top: 100,
          width: 960,
          fontSize: 160,
          fontFamily: 'Satoshi',
          fontWeight: '900',
          fill: '#F5F7FB',
          lineHeight: 0.9,
          charSpacing: -60,
          textAlign: 'center',
        },
      },
      {
        type: 'rect',
        role: 'decorator',
        props: {
          left: 500,
          top: 450,
          width: 80,
          height: 4,
          fill: '#6C4CE4',
          rx: 2,
        },
      },
      {
        type: 'textbox',
        role: 'body',
        props: {
          text: 'La simplicidad es la máxima sofisticación.',
          left: 60,
          top: 800,
          width: 960,
          fontSize: 42,
          fontFamily: 'Inter',
          fontWeight: '500',
          fill: '#8D95A6',
          textAlign: 'center',
          lineHeight: 1.4,
        },
      },
    ],
  },
  'glass-tech': {
    id: 'glass-tech',
    name: 'Glass Tech',
    description: 'Efectos de transparencia y gradientes modernos.',
    category: 'Tech',
    thumbnail: 'linear-gradient(135deg, #6C4CE4 0%, #462D6E 100%)',
    applicableTo: ['cover', 'content'],
    canvasBackground: {
      type: 'gradient',
      default: 'linear-gradient(135deg, #101417 0%, #2D1B4E 100%)',
    },
    objects: [
      {
        type: 'circle',
        role: 'decorator',
        props: {
          left: 600,
          top: -100,
          radius: 300,
          fill: 'rgba(108,76,228,0.2)',
          blur: 100,
        },
      },
      {
        type: 'rect',
        role: 'decorator',
        props: {
          left: 60,
          top: 240,
          width: 960,
          height: 600,
          fill: 'rgba(255,255,255,0.03)',
          rx: 40,
          stroke: 'rgba(255,255,255,0.1)',
          strokeWidth: 2,
        },
      },
      {
        type: 'textbox',
        role: 'headline',
        props: {
          text: 'Future of Social',
          left: 120,
          top: 360,
          width: 840,
          fontSize: 88,
          fontFamily: 'Satoshi',
          fontWeight: '900',
          fill: '#FFFFFF',
          lineHeight: 1.1,
        },
      },
      {
        type: 'textbox',
        role: 'body',
        props: {
          text: 'Transformando la manera en que creas contenido visual.',
          left: 120,
          top: 580,
          width: 800,
          fontSize: 36,
          fontFamily: 'Inter',
          fontWeight: '400',
          fill: 'rgba(255,255,255,0.6)',
          lineHeight: 1.5,
        },
      },
    ],
  },
  'serif-impact': {
    id: 'serif-impact',
    name: 'Serif Impact',
    description: 'Elegancia y autoridad con tipografía Serif clásica.',
    category: 'Creative',
    thumbnail: 'linear-gradient(135deg, #101417 0%, #101417 100%)',
    applicableTo: ['cover', 'content'],
    canvasBackground: {
      type: 'solid',
      default: '#101417',
    },
    objects: [
      {
        type: 'textbox',
        role: 'headline',
        props: {
          text: 'The Art of Writing',
          left: 60,
          top: 140,
          width: 960,
          fontSize: 130,
          fontFamily: 'Playfair Display, serif',
          fontWeight: '900',
          fill: '#F5F7FB',
          lineHeight: 1.0,
          fontStyle: 'italic',
        },
      },
      {
        type: 'textbox',
        role: 'body',
        props: {
          text: 'Explora por qué las palabras tienen el poder de cambiar percepciones profundamente.',
          left: 60,
          top: 800,
          width: 850,
          fontSize: 38,
          fontFamily: 'Inter',
          fontWeight: '400',
          fill: '#8D95A6',
          lineHeight: 1.6,
        },
      },
    ],
  },
  'clean-startup': {
    id: 'clean-startup',
    name: 'Clean Startup',
    description: 'Colores vibrantes sobre fondos limpios para una imagen moderna.',
    category: 'Corporate',
    thumbnail: 'linear-gradient(135deg, #F5F7FB 0%, #E0E5EB 100%)',
    applicableTo: ['cover', 'content', 'cta'],
    canvasBackground: {
      type: 'solid',
      default: '#F5F7FB',
    },
    objects: [
      {
        type: 'rect',
        role: 'decorator',
        props: {
          left: 0,
          top: 0,
          width: 1080,
          height: 200,
          fill: '#6C4CE4',
        },
      },
      {
        type: 'textbox',
        role: 'headline',
        props: {
          text: 'Acelera tu Crecimiento',
          left: 60,
          top: 300,
          width: 960,
          fontSize: 100,
          fontFamily: 'Satoshi',
          fontWeight: '900',
          fill: '#101417',
          lineHeight: 1.1,
        },
      },
      {
        type: 'textbox',
        role: 'body',
        props: {
          text: 'Herramientas diseñadas para equipos que buscan la excelencia operativa.',
          left: 60,
          top: 800,
          width: 800,
          fontSize: 38,
          fontFamily: 'Inter',
          fontWeight: '500',
          fill: '#4E576A',
          lineHeight: 1.5,
        },
      },
    ],
  },
  'gradient-vibe': {
    id: 'gradient-vibe',
    name: 'Gradient Vibe',
    description: 'Estilo Gen-Z con gradientes ácidos y tipografía bold.',
    category: 'Viral',
    thumbnail: 'linear-gradient(135deg, #FF3D00 0%, #FFD600 100%)',
    applicableTo: ['cover', 'content'],
    canvasBackground: {
      type: 'gradient',
      default: 'linear-gradient(135deg, #FF3D00 0%, #FFD600 100%)',
    },
    objects: [
      {
        type: 'textbox',
        role: 'headline',
        props: {
          text: 'LOUD & CLEAR',
          left: 60,
          top: 100,
          width: 960,
          fontSize: 150,
          fontFamily: 'Satoshi',
          fontWeight: '900',
          fill: '#101417',
          lineHeight: 0.85,
          charSpacing: -40,
        },
      },
      {
        type: 'textbox',
        role: 'body',
        props: {
          text: 'Rompe el ruido con contenido que no solo se ve, se siente.',
          left: 60,
          top: 800,
          width: 900,
          fontSize: 40,
          fontFamily: 'Inter',
          fontWeight: '600',
          fill: '#101417',
          lineHeight: 1.3,
        },
      },
    ],
  },
  'list-minimal': {
    id: 'list-minimal',
    name: 'List Minimal',
    description: 'Lista de pasos con enfoque en el flujo visual.',
    category: 'Educational',
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
          text: '3 Pasos para el Éxito',
          left: 60,
          top: 60,
          width: 900,
          fontSize: 72,
          fontFamily: 'Satoshi',
          fontWeight: '900',
          fill: '#F5F7FB',
        },
      },
      {
        type: 'rect',
        role: 'decorator',
        props: {
          left: 60,
          top: 240,
          width: 960,
          height: 200,
          fill: 'rgba(255,255,255,0.03)',
          rx: 24,
        },
      },
      {
        type: 'textbox',
        role: 'counter',
        props: {
          text: '01',
          left: 100,
          top: 290,
          fontSize: 80,
          fontFamily: 'Satoshi',
          fontWeight: '900',
          fill: '#6C4CE4',
        },
      },
      {
        type: 'textbox',
        role: 'body',
        props: {
          text: 'Define tu objetivo con total claridad.',
          left: 240,
          top: 315,
          width: 720,
          fontSize: 34,
          fontFamily: 'Inter',
          fontWeight: '500',
          fill: '#F5F7FB',
        },
      },
      {
        type: 'rect',
        role: 'decorator',
        props: {
          left: 60,
          top: 480,
          width: 960,
          height: 200,
          fill: 'rgba(255,255,255,0.03)',
          rx: 24,
        },
      },
      {
        type: 'textbox',
        role: 'counter',
        props: {
          text: '02',
          left: 100,
          top: 530,
          fontSize: 80,
          fontFamily: 'Satoshi',
          fontWeight: '900',
          fill: '#6C4CE4',
        },
      },
      {
        type: 'textbox',
        role: 'body',
        props: {
          text: 'Ejecuta con disciplina diaria.',
          left: 240,
          top: 555,
          width: 720,
          fontSize: 34,
          fontFamily: 'Inter',
          fontWeight: '500',
          fill: '#F5F7FB',
        },
      },
    ],
  },
}
