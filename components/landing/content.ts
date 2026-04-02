export type LandingLocale = 'es' | 'en'

type LocalizedText = Record<LandingLocale, string>

type ProblemPair = {
  problem: LocalizedText
  solution: LocalizedText
}

type Step = {
  body: LocalizedText
  title: LocalizedText
}

type Feature = {
  description: LocalizedText
  icon:
    | 'brain'
    | 'calendar'
    | 'folder'
    | 'layers'
    | 'lightning'
    | 'message'
    | 'sparkles'
    | 'target'
    | 'users'
  title: LocalizedText
}

type ComparisonItem = {
  after: LocalizedText
  before: LocalizedText
}

type AudienceBullet = LocalizedText

type FaqItem = {
  answer: LocalizedText
  question: LocalizedText
}

type PlatformPreview = {
  badge: LocalizedText
  body: LocalizedText
  exportLabel: LocalizedText
  footer: LocalizedText
  hook: LocalizedText
  id: 'instagram' | 'linkedin' | 'x'
  label: string
}

type ExampleOutput = {
  badge: LocalizedText
  body: LocalizedText
  cta: LocalizedText
  hook: LocalizedText
  id: string
}

type PricingPlan = {
  title: LocalizedText
  monthly: {
    regular: number
    founder: number
  }
  annual: {
    regular: number
    founder: number
  }
  features: LocalizedText[]
  popular?: boolean
}

export const landingContent = {
  exampleOutputs: {
    heading: {
      en: 'Content that moves the needle.',
      es: 'Contenido que mueve la aguja.',
    },
    label: {
      en: 'OUTPUT SAMPLES',
      es: 'EJEMPLOS DE SALIDA',
    },
    items: [
      {
        badge: {
          en: 'Educational',
          es: 'Educativo',
        },
        body: {
          en: "Authority isn't about posting more; it's about saying the right idea enough times. Here are 3 filters to use before you hit post to ensure your content actually builds a brand.",
          es: 'La autoridad no se trata de publicar más; se trata de decir la idea correcta las veces necesarias. Aquí tienes 3 filtros para usar antes de publicar y asegurar que tu contenido construye marca.',
        },
        cta: {
          en: 'Explore the LinkedIn strategy',
          es: 'Explorar la estrategia en LinkedIn',
        },
        hook: {
          en: 'Most brand accounts confuse noise with presence. Precision wins.',
          es: 'La mayoría de cuentas de marca confunden ruido con presencia. La precisión gana.',
        },
        id: 'educational',
      },
      {
        badge: {
          en: 'Storytelling',
          es: 'Storytelling',
        },
        body: {
          en: "I spent 4 years building in silence. Then I realized silence doesn't pay the bills. I started documenting the process, the failures, and the small wins. Here is how I turned my expertise into a client magnet.",
          es: 'Pasé 4 años construyendo en silencio. Luego me di cuenta de que el silencio no paga las cuentas. Empecé a documentar el proceso, los fallos y las pequeñas victorias. Así convertí mi experiencia en un imán de clientes.',
        },
        cta: {
          en: 'Read the X thread',
          es: 'Leer el hilo de X',
        },
        hook: {
          en: 'Expertise is invisible until you learn to document it properly.',
          es: 'La experiencia es invisible hasta que aprendes a documentarla correctamente.',
        },
        id: 'storytelling',
      },
      {
        badge: {
          en: 'Authority',
          es: 'Autoridad',
        },
        body: {
          en: "Your category doesn't need another trend summary. It needs a point of view with operating details, tradeoffs, and examples from the real work you already do. Framework inside.",
          es: 'Tu categoría no necesita otro resumen de tendencias. Necesita un punto de vista con detalles operativos, sacrificios y ejemplos del trabajo real que ya haces.',
        },
        cta: {
          en: 'See the carousel framework',
          es: 'Ver el framework de carrusel',
        },
        hook: {
          en: 'If your content sounds like everyone else, the market assumes you are too.',
          es: 'Si tu contenido suena como el de todos, el mercado asume que tú también.',
        },
        id: 'authority',
      },
    ] satisfies ExampleOutput[],
    gallery: {
      heading: {
        en: 'Studio-grade output.',
        es: 'Resultados de grado estudio.',
      },
      subheading: {
        en: 'A sample of how the engine transforms your ideas into high-performance assets for every platform.',
        es: 'Una muestra de cómo el motor transforma tus ideas en activos de alto rendimiento para cada plataforma.',
      },
    },
  },
  navbar: {
    links: [
      {
        href: '#como-funciona',
        label: {
          en: 'How it works',
          es: 'Cómo funciona',
        },
      },
      {
        href: '#capacidades',
        label: {
          en: 'Capabilities',
          es: 'Capacidades',
        },
      },
      {
        href: '#esto-es-para-ti',
        label: {
          en: 'This is for you',
          es: 'Esto es para ti',
        },
      },
      {
        href: '#precios',
        label: {
          en: 'Pricing',
          es: 'Precios',
        },
      },
    ],
    signIn: {
      en: 'Access the Engine',
      es: 'Acceso al Motor',
    },
    wordmark: 'Social',
  },
  hero: {
    cta: {
      en: 'Secure your founding invitation',
      es: 'Asegura tu invitación fundadora',
    },
    label: {
      en: 'NOCTRA SOCIAL — CONTENT AUTHORITY SYSTEM',
      es: 'NOCTRA SOCIAL — SISTEMA DE AUTORIDAD DE CONTENIDO',
    },
    secondaryCta: {
      en: 'See the system in action',
      es: 'Mira el sistema en acción',
    },
    subheadline: {
      en: 'The high-performance system for founders and experts to build authority and grow their business through consistent, publish-ready content.',
      es: 'El sistema de alto rendimiento para que fundadores y expertos construyan autoridad y hagan crecer su negocio con contenido listo para publicar.',
    },
    title: {
      en: 'Get clients through content without the manual planning grind.',
      es: 'Consigue clientes con contenido sin el desgaste de planear cada post.',
    },
    trustLine: {
      en: 'Internal Release — Accepting 3 new experts this week.',
      es: 'Release Interno — Aceptando 3 nuevos expertos esta semana.',
    },
  },
  problem: {
    heading: {
      en: "Posting without a system doesn't build a brand.",
      es: 'Publicar sin sistema no construye marca.',
    },
    label: {
      en: 'THE PROBLEM',
      es: 'EL PROBLEMA',
    },
    pairs: [
      {
        problem: {
          en: 'Each post starts from an empty prompt and sounds different from the last one.',
          es: 'Cada post sale de un prompt vacío y suena distinto al anterior.',
        },
        solution: {
          en: 'Your brand is unmistakable in every post, with zero manual editing.',
          es: 'Tu marca es inconfundible en cada post, sin esfuerzo manual.',
        },
      },
      {
        problem: {
          en: 'Adapting the same idea to three platforms takes more time than creating it.',
          es: 'Adaptar el mismo contenido a tres plataformas toma más tiempo que crearlo.',
        },
        solution: {
          en: 'Generate once. Export three publish-ready assets for each network.',
          es: 'Genera una vez. Exporta tres activos listos para publicar por red.',
        },
      },
      {
        problem: {
          en: "You don't know what to publish, when to publish it or in what order.",
          es: 'No sabes qué publicar, cuándo, ni en qué orden.',
        },
        solution: {
          en: 'Autonomous planning that prioritizes authority over noise.',
          es: 'Planeación autónoma que prioriza autoridad sobre ruido.',
        },
      },
      {
        problem: {
          en: "The content doesn't reflect what you do or who you speak to.",
          es: 'El contenido no refleja lo que haces ni a quién le hablas.',
        },
        solution: {
          en: 'Deep calibration by audience, tone, and strategic brand pillars.',
          es: 'Calibración profunda por audiencia, tono y pilares estratégicos.',
        },
      },
      {
        problem: {
          en: 'You generate a lot of content. You build little authority.',
          es: 'Generas mucho contenido. Construyes poca autoridad.',
        },
        solution: {
          en: 'Every post is a piece of a high-performance growth system.',
          es: 'Cada post es una pieza de un sistema de crecimiento de alto rendimiento.',
        },
      },
    ] satisfies ProblemPair[],
  },
  demo: {
    heading: {
      en: 'One interface. Three platforms. Your voice.',
      es: 'Una interfaz. Tres plataformas. Tu voz.',
    },
    label: {
      en: 'THE SYSTEM',
      es: 'EL SISTEMA',
    },
    platformPills: [
      {
        en: '📷 Instagram — Carousel + audio',
        es: '📷 Instagram — Carrusel + audio',
      },
      {
        en: '𝕏 X — Threads + articles',
        es: '𝕏 X — Hilos + artículos',
      },
      {
        en: 'in LinkedIn — PDF document + text',
        es: 'in LinkedIn — Documento PDF + texto',
      },
    ],
    subheading: {
      en: "Noctra Social is not a generic generator. It’s a content authority system calibrated to your specific tone, audience, and brand pillars.",
      es: "Noctra Social no es un generador genérico. Es un sistema de autoridad de contenido calibrado a tu tono, audiencia y pilares de marca.",
    },
  },
  howItWorks: {
    heading: {
      en: 'From idea to publication-ready file.',
      es: 'De la idea al archivo listo para publicar.',
    },
    label: {
      en: 'HOW IT WORKS',
      es: 'CÓMO FUNCIONA',
    },
    steps: [
      {
        body: {
          en: 'Instill your brand DNA, technical values and content pillars. The Engine uses them as the base of every generation.',
          es: 'Instila el ADN de tu marca, valores técnicos y pilares de contenido. El Motor los usa como base en cada generación.',
        },
        title: {
          en: 'Install brand DNA',
          es: 'Instila el ADN de marca',
        },
      },
      {
        body: {
          en: 'Stop losing high-value thoughts. Capture any concept instantly and let the system organize your authority bank.',
          es: 'Deja de perder pensamientos de alto valor. Captura cualquier concepto al instante y deja que el sistema lo organice.',
        },
        title: {
          en: 'Build your Authority Bank',
          es: 'Banco de Autoridad',
        },
      },
      {
        body: {
          en: 'Transform thoughts into publish-ready assets. Choose your platform, angle and generation mode with one click.',
          es: 'Transforma pensamientos en activos listos para publicar. Elige plataforma, ángulo y modo de generación.',
        },
        title: {
          en: 'Strategic Generation',
          es: 'Generación Estratégica',
        },
      },
      {
        body: {
          en: 'Instagram UHD images, LinkedIn PDF carousels, and X threads. Optimized, designed, and ready to post.',
          es: 'Imágenes UHD para Instagram, carruseles PDF para LinkedIn e hilos para X. Optimizado para publicar al instante.',
        },
        title: {
          en: 'Studio-Quality Exports',
          es: 'Exportación de Studio',
        },
      },
      {
        body: {
          en: 'Rate every post. The AI extracts patterns from your real history to perfect every subsequent generation.',
          es: 'Califica cada post. La IA extrae patrones de tu historial real para perfeccionar cada generación siguiente.',
        },
        title: {
          en: 'The Machine Calibrates',
          es: 'Calibración Continua',
        },
      },
    ] satisfies Step[],
  },
  features: {
    heading: {
      en: 'The internal engine for high-performance experts.',
      es: 'El motor interno para expertos de alto rendimiento.',
    },
    label: {
      en: 'CAPABILITIES',
      es: 'CAPACIDADES',
    },
    items: [
      {
        description: {
          en: 'Every post uses your specific tone, values and forbidden words. Your brand is unmistakably yours.',
          es: 'Cada post usa tu tono, valores y palabras prohibidas específicas. Tu marca es inconfundiblemente tuya.',
        },
        icon: 'message',
        title: {
          en: 'Unmistakable Brand Voice',
          es: 'Voz de Marca Inconfundible',
        },
      },
      {
        description: {
          en: 'Scale your ideas to 3 platforms instantly. Instagram UHD, LinkedIn PDF Carousels and X Threads.',
          es: 'Escala tus ideas a 3 plataformas al instante. Instagram UHD, Carruseles para LinkedIn e Hilos de X.',
        },
        icon: 'lightning',
        title: {
          en: 'Omnichannel Engine',
          es: 'Motor Omnicanal',
        },
      },
      {
        description: {
          en: 'Automatic gaussian blur, glassmorphism and contrast layers for a studio-quality visual impact.',
          es: 'Desenfoque gaussiano, glassmorphism y capas de contraste automáticas para un impacto visual de estudio.',
        },
        icon: 'layers',
        title: {
          en: 'Studio-Grade Aesthetics',
          es: 'Estética de Grado Studio',
        },
      },
      {
        description: {
          en: 'Define up to 4 strategic content territories. The visual grid ensures your message is balanced.',
          es: 'Define hasta 4 territorios estratégicos. El grid visual asegura que tu mensaje esté balanceado.',
        },
        icon: 'target',
        title: {
          en: 'Strategic Territories',
          es: 'Territorios Estratégicos',
        },
      },
      {
        description: {
          en: 'Deep calibration by specific audience. The system adjusts technical depth and examples for each reader.',
          es: 'Calibración profunda por audiencia. El sistema ajusta tecnicidad y ejemplos para cada perfil de lector.',
        },
        icon: 'users',
        title: {
          en: 'Audience Calibration',
          es: 'Calibración de Audiencia',
        },
      },
      {
        description: {
          en: 'Every rating feeds the engine. Quality improves noticeably as the system aligns with your real work history.',
          es: 'Cada calificación alimenta el motor. La calidad mejora mientras el sistema se alinea con tu historial real.',
        },
        icon: 'brain',
        title: {
          en: 'Closed-Loop Learning',
          es: 'Aprendizaje de Ciclo Cerrado',
        },
      },
    ] satisfies Feature[],
  },
  editorShowcase: {
    heading: {
      en: 'Absolute control over every pixel.',
      es: 'Control absoluto sobre cada píxel.',
    },
    label: {
      en: 'PRO DESIGN ENGINE',
      es: 'MOTOR DE DISEÑO PRO',
    },
    subheading: {
      en: "Noctra Social isn't a black box. Our studio-grade editor gives you total creative freedom to adjust typography, layers, and themes with professional precision.",
      es: "Noctra Social no es una caja negra. Nuestro editor de grado estudio te da total libertad creativa para ajustar tipografía, capas y temas con precisión profesional.",
    },
    features: [
      { en: 'Fluid Type Scale', es: 'Escala Tipográfica Fluida' },
      { en: 'Layer Management', es: 'Gestión de Capas' },
      { en: 'Custom Branding', es: 'Branding Personalizado' },
      { en: 'UHD Export', es: 'Exportación UHD' },
    ],
  },
  comparison: {
    heading: {
      en: 'The transformation from chaos to authority.',
      es: 'La transformación del caos a la autoridad.',
    },
    label: {
      en: 'TRANSFORMATION',
      es: 'TRANSFORMACIÓN',
    },
    subheading: {
      en: 'Stop reacting to the algorithm. Start executing a high-performance system that turns your expertise into business growth.',
      es: 'Deja de reaccionar al algoritmo. Empieza a ejecutar un sistema de alto rendimiento que convierte tu experiencia en crecimiento.',
    },
    items: [
      {
        before: {
          en: 'No clear posting plan.',
          es: 'Sin plan de publicación claro.',
        },
        after: {
          en: 'Clear content direction.',
          es: 'Dirección de contenido clara.',
        },
      },
      {
        before: {
          en: 'Inconsistent content.',
          es: 'Contenido inconsistente.',
        },
        after: {
          en: 'Repeatable content system.',
          es: 'Sistema de contenido repetible.',
        },
      },
      {
        before: {
          en: 'Too much time wasted.',
          es: 'Demasiado tiempo perdido.',
        },
        after: {
          en: 'Faster execution.',
          es: 'Ejecución acelerada.',
        },
      },
      {
        before: {
          en: 'No traction from social content.',
          es: 'Contenido sin tracción ni impacto.',
        },
        after: {
          en: 'More authority-building content.',
          es: 'Más contenido que construye autoridad.',
        },
      },
      {
        before: {
          en: 'Hard to turn expertise into posts.',
          es: 'Difícil convertir experiencia en posts.',
        },
        after: {
          en: 'Better client attraction.',
          es: 'Atracción de clientes cualificados.',
        },
      },
    ] satisfies ComparisonItem[],
  },
  forWho: {
    heading: {
      en: 'This is for you if...',
      es: 'Esto es para ti si...',
    },
    intro: {
      en: 'You’re tired of shouting into the void. It’s time for a system that works as hard as you do.',
      es: 'Estás cansado de gritar al vacío. Es momento de un sistema que trabaje tan duro como tú.',
    },
    bullets: [
      {
        en: 'Your calendar is full, but your sales pipeline is refreshingly empty.',
        es: 'Tu calendario está lleno, pero tu flujo de clientes es impredecible.',
      },
      {
        en: 'You spend weekends editing content that barely gets any engagement.',
        es: 'Pasas tus fines de semana editando contenido que no genera impacto.',
      },
      {
        en: 'You are a recognized expert, but your posts sound like everyone else.',
        es: 'Eres un experto en lo tuyo, pero tus posts suenan genéricos.',
      },
      {
        en: 'Consistency feels impossible because creating content manually is exhausting.',
        es: 'La consistencia parece imposible porque crear manualmente te agota.',
      },
      {
        en: 'Publishing feels like a secondary chore rather than a growth engine.',
        es: 'Publicar se siente como una carga pesada, no como motor de negocio.',
      },
      {
        en: 'You have plenty of views, but they never turn into actual clients.',
        es: 'Tienes muchas visitas, pero nunca se traducen en clientes reales.',
      },
    ] satisfies AudienceBullet[],
    label: {
      en: 'WHO IT IS FOR',
      es: 'PARA QUIÉN',
    },
  },
  pricing: {
    heading: {
      en: 'Clear pricing for building content with a system',
      es: 'Precios claros para construir contenido con sistema',
    },
    subheading: {
      en: 'Choose a plan, lock your founder price, and scale at your pace.',
      es: 'Elige un plan, bloquea tu precio fundador y escala a tu ritmo.',
    },
    founderBadge: {
      en: 'Founder pricing',
      es: 'Precio fundador',
    },
    founderNote: {
      en: 'Keep this price as long as your subscription remains active.',
      es: 'Mantén este precio mientras tu suscripción siga activa.',
    },
    urgencyNote: {
      en: 'Available for early adopters',
      es: 'Disponible para early adopters',
    },
    currencyNote: {
      en: 'USD prices are based on a reference exchange rate.',
      es: 'Precios en USD basados en tipo de cambio de referencia.',
    },
    label: {
      en: 'PRICING',
      es: 'PRECIOS',
    },
    note: {
      en: 'Choose a plan, lock your founder price, and scale at your pace.',
      es: 'Elige un plan, bloquea tu precio fundador y escala a tu ritmo.',
    },
    billing: {
      monthly: { en: 'Monthly', es: 'Mensual' },
      annual: { en: 'Annual', es: 'Anual' },
    },
    cta: {
      en: 'Join the priority list',
      es: 'Unirme a la lista prioritaria',
    },
    plans: [
      {
        title: { en: 'Founder', es: 'Fundador' },
        monthly: { regular: 349, founder: 249 },
        annual: { regular: 3348, founder: 2388 },
        features: [
          { en: '1 brand', es: '1 marca' },
          { en: '3 platforms', es: '3 plataformas' },
          { en: '60 generations / mo', es: '60 generaciones / mes' },
          { en: 'Brand voice', es: 'Brand voice' },
          { en: 'Content pillars', es: 'Pilares de contenido' },
        ],
      },
      {
        title: { en: 'Studio', es: 'Estudio' },
        monthly: { regular: 749, founder: 599 },
        annual: { regular: 7188, founder: 5988 },
        popular: true,
        features: [
          { en: 'Up to 3 brands', es: 'Hasta 3 marcas' },
          { en: '180 generations / mo', es: '180 generaciones / mes' },
          { en: 'Editorial calendar', es: 'Calendario editorial' },
          { en: 'Idea bank', es: 'Banco de ideas' },
          { en: 'Priority support', es: 'Soporte prioritario' },
        ],
      },
      {
        title: { en: 'Agency', es: 'Agencia' },
        monthly: { regular: 1490, founder: 1190 },
        annual: { regular: 14280, founder: 11880 },
        features: [
          { en: 'Up to 10 brands', es: 'Hasta 10 marcas' },
          { en: '500 generations / mo', es: '500 generaciones / mes' },
          { en: 'Multi-brand workflow', es: 'Multi-brand workflow' },
          { en: 'Custom branding', es: 'Branding personalizado' },
          { en: 'Concierge onboarding', es: 'Onboarding prioritario' },
        ],
      },
    ] satisfies PricingPlan[],
  },
  faq: {
    heading: {
      en: 'What founders ask before joining.',
      es: 'Lo que fundadores preguntan antes de unirse.',
    },
    items: [
      {
        answer: {
          en: "ChatGPT responds to individual prompts without accumulated context. Noctra Social keeps your brand voice, your content pillars and your feedback history in every generation. You don't write a prompt every time — the system already knows who you are and who you write for.",
          es: 'ChatGPT responde a prompts individuales sin contexto acumulado. Noctra Social mantiene tu voz de marca, tus pilares de contenido y tu historial de feedback en cada generación. No escribes un prompt cada vez — el sistema ya sabe quién eres y para quién escribes.',
        },
        question: {
          en: "What's the difference between this and ChatGPT?",
          es: '¿Qué diferencia hay entre esto y ChatGPT?',
        },
      },
      {
        answer: {
          en: "No. The app has three entry modes: one for when you know exactly what to publish, one for when you have a partial idea and one for when you don't know where to start. The integrated tutorial explains what works on each platform.",
          es: 'No. La app tiene tres modos de entrada: uno para cuando sabes exactamente qué publicar, otro para cuando tienes una idea a medias, y uno para cuando no sabes por dónde empezar. El tutorial integrado explica qué funciona en cada plataforma.',
        },
        question: {
          en: 'Do I need to know social media to use it?',
          es: '¿Necesito saber de redes sociales para usarlo?',
        },
      },
      {
        answer: {
          en: 'Instagram exports UHD images ready-to-post as stories or feed posts. X exports the optimized text for threads. LinkedIn exports the carousel PDF and text bundle separately and ready to upload.',
          es: 'Instagram exporta imágenes UHD listas para publicar como historias o posts. X exporta el texto optimizado para hilos. LinkedIn exporta el PDF de carrusel y el texto optimizado listos para subir.',
        },
        question: {
          en: 'How does export work?',
          es: '¿Cómo funciona la exportación?',
        },
      },
      {
        answer: {
          en: 'Yes, but in a specific way. After 5 posts with feedback (rating + whether you published it), the system extracts patterns from what worked and injects them into the next generations. It is not generic learning — it is calibration on your real history.',
          es: 'Sí, pero de forma específica. Después de 5 posts con feedback (rating + si lo publicaste), el sistema extrae patrones de lo que funcionó y lo inyecta en las siguientes generaciones. No es aprendizaje genérico — es calibración sobre tu historial real.',
        },
        question: {
          en: 'Does the AI really learn from my posts?',
          es: '¿La IA realmente aprende de mis posts?',
        },
      },
      {
        answer: {
          en: 'Currently each account has one brand configuration. Multi-brand support for agencies is on the roadmap.',
          es: 'Actualmente cada cuenta tiene una configuración de marca. El soporte multi-marca para agencias está en el roadmap.',
        },
        question: {
          en: 'Can I use it for multiple clients or brands?',
          es: '¿Puedo usarlo para varios clientes o marcas?',
        },
      },
      {
        answer: {
          en: 'Anthropic (claude-3-5-sonnet) for text generation, Gemini (Flash/Pro) for visual scoring and design analysis, and Unsplash for photo search. Everything runs on Next.js with Supabase.',
          es: 'Anthropic (claude-3-5-sonnet) para texto, Gemini (Flash/Pro) para scoring visual y análisis de diseño, y Unsplash para búsqueda fotográfica. Todo corre sobre Next.js con Supabase.',
        },
        question: {
          en: 'What technologies does it use?',
          es: '¿Qué tecnologías usa?',
        },
      },
    ] satisfies FaqItem[],
    label: {
      en: 'QUESTIONS',
      es: 'PREGUNTAS',
    },
  },
  finalCta: {
    body: {
      en: "Content that builds brand isn't improvised. It's systematized.",
      es: 'El contenido que construye marca no se improvisa. Se sistematiza.',
    },
    button: {
      en: 'Secure your founding invitation',
      es: 'Asegura tu invitación fundadora',
    },
  },
  footer: {
    bottomLeft: {
      en: '© 2026 Noctra Studio · All rights reserved',
      es: '© 2026 Noctra Studio · Todos los derechos reservados',
    },
    bottomRight: {
      en: 'Diseñado en Querétaro con ☕',
      es: 'Diseñado en Querétaro con ☕',
    },
    columns: {
      legal: {
        en: 'Legal',
        es: 'Legal',
      },
      platform: {
        en: 'Platform',
        es: 'Plataforma',
      },
      resources: {
        en: 'Resources',
        es: 'Recursos',
      },
    },
    links: {
      legal: [
        {
          href: '/es/terminos',
          label: {
            en: 'Terms of Service',
            es: 'Términos de Servicio',
          },
        },
        {
          href: '/es/privacidad',
          label: {
            en: 'Privacy Policy',
            es: 'Política de Privacidad',
          },
        },
      ],
      platform: [
        {
          href: '#como-funciona',
          label: {
            en: 'How it works',
            es: 'Cómo funciona',
          },
        },
        {
          href: '#capacidades',
          label: {
            en: 'Capabilities',
            es: 'Capacidades',
          },
        },
        {
          href: '#precios',
          label: {
            en: 'Pricing',
            es: 'Precios',
          },
        },
        {
          href: '/login',
          label: {
            en: 'Sign in',
            es: 'Iniciar sesión',
          },
        },
      ],
      resources: [
        {
          href: '/login',
          label: {
            en: 'Tutorial',
            es: 'Tutorial',
          },
        },
        {
          href: 'https://noctra.studio',
          label: {
            en: 'Noctra Studio',
            es: 'Noctra Studio',
          },
        },
        {
          href: 'https://crm.noctra.studio',
          label: {
            en: 'Noctra CRM',
            es: 'Noctra CRM',
          },
        },
      ],
    },
    tagline: {
      en: 'AI-native brand content system',
      es: 'Sistema de contenido de marca nativo en IA',
    },
  },
  mockupTabs: [
    {
      badge: {
        en: 'Carousel strategy',
        es: 'Estrategia de carrusel',
      },
      body: {
        en: 'Authority isn’t about posting more. It’s about saying the right idea enough times.',
        es: 'La autoridad no sale de publicar más. Sale de decir una idea precisa las veces necesarias.',
      },
      exportLabel: {
        en: 'Export ZIP',
        es: 'Exportar ZIP',
      },
      footer: {
        en: 'Instagram UHD Carousel — Optimized for authority.',
        es: 'Carrusel UHD para Instagram — Optimizado para autoridad.',
      },
      hook: {
        en: 'Brand precision beats social volume.',
        es: 'La precisión de marca vence al volumen social.',
      },
      id: 'instagram',
      label: 'Instagram',
    },
    {
      badge: {
        en: 'Network depth',
        es: 'Profundidad de red',
      },
      body: {
        en: 'LinkedIn builds trust through depth. Precision articles and PDF carousels that prove your expertise.',
        es: 'LinkedIn construye confianza a través de la profundidad. Artículos y PDFs que prueban tu experiencia.',
      },
      exportLabel: {
        en: 'Export PDF',
        es: 'Exportar PDF',
      },
      footer: {
        en: 'LinkedIn PDF Document — Calibrated for experts.',
        es: 'Documento PDF para LinkedIn — Calibrado para expertos.',
      },
      hook: {
        en: 'Expertise is invisible until documented.',
        es: 'La experiencia es invisible hasta que se documenta.',
      },
      id: 'linkedin',
      label: 'LinkedIn',
    },
    {
      badge: {
        en: 'Thread engine',
        es: 'Motor de hilos',
      },
      body: {
        en: 'Capture trends and build storytelling threads that stop the scroll. X threads optimized for reach.',
        es: 'Captura tendencias y construye hilos de storytelling. Hilos de X optimizados para alcance.',
      },
      exportLabel: {
        en: 'Export Text',
        es: 'Exportar Texto',
      },
      footer: {
        en: 'X Thread Bundle — Designed for virality.',
        es: 'Bundle de Hilos de X — Diseñado para viralidad.',
      },
      hook: {
        en: 'Silence doesn’t pay the bills.',
        es: 'El silencio no paga las cuentas.',
      },
      id: 'x',
      label: 'X (Twitter)',
    },
  ],
}
