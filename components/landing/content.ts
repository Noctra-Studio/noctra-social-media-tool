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

type ComparisonValue = 'yes' | 'no' | 'partial' | 'manual' | 'separate'

type ComparisonRow = {
  label: LocalizedText
  values: Record<'generic' | 'chatgpt' | 'noctra', ComparisonValue>
}

type AudienceCard = {
  challenge: LocalizedText
  challengeLabel: LocalizedText
  note?: LocalizedText
  solution: LocalizedText
  solutionLabel: LocalizedText
  title: LocalizedText
}

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

export const landingContent = {
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
        href: '#para-quien',
        label: {
          en: 'Who it is for',
          es: 'Para quién',
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
      en: 'Sign in',
      es: 'Iniciar sesión',
    },
    wordmark: 'Social',
  },
  hero: {
    cta: {
      en: 'Sign in',
      es: 'Iniciar sesión',
    },
    label: {
      en: 'NOCTRA SOCIAL — CONTENT SYSTEM',
      es: 'NOCTRA SOCIAL — CONTENT SYSTEM',
    },
    secondaryCta: {
      en: 'See how it works',
      es: 'Ver cómo funciona',
    },
    subheadline: {
      en: 'Generate, organize and export content for Instagram, LinkedIn and X with AI trained on your brand voice. No prompts. No friction. With purpose.',
      es: 'Genera, organiza y exporta contenido para Instagram, LinkedIn y X con IA entrenada en tu voz de marca. Sin prompts. Sin fricción. Con criterio.',
    },
    title: {
      en: 'Brand content that builds authority.',
      es: 'Contenido de marca que construye autoridad.',
    },
    trustLine: {
      en: '✦ Anthropic · ✦ Gemini · ✦ Unsplash — three engines, one interface',
      es: '✦ Anthropic · ✦ Gemini · ✦ Unsplash — tres motores, una sola interfaz',
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
          en: 'The AI uses your configured brand voice in every generation.',
          es: 'La IA usa tu voz de marca configurada en cada generación.',
        },
      },
      {
        problem: {
          en: 'Adapting the same idea to three platforms takes more time than creating it.',
          es: 'Adaptar el mismo contenido a tres plataformas toma más tiempo que crearlo.',
        },
        solution: {
          en: 'Generate one idea and export it in the right format for each network.',
          es: 'Genera una idea y expórtala en el formato correcto para cada red.',
        },
      },
      {
        problem: {
          en: "You don't know what to publish, when to publish it or in what order.",
          es: 'No sabes qué publicar, cuándo, ni en qué orden.',
        },
        solution: {
          en: 'The calendar and quick actions organize your editorial week.',
          es: 'El calendario y las acciones rápidas organizan tu semana editorial.',
        },
      },
      {
        problem: {
          en: "The content doesn't reflect what you do or who you speak to.",
          es: 'El contenido no refleja lo que haces ni a quién le hablas.',
        },
        solution: {
          en: 'Define your pillars and audience. The AI calibrates every post for them.',
          es: 'Define tus pilares y audiencia. La IA calibra cada post para ellos.',
        },
      },
      {
        problem: {
          en: 'You generate a lot of content. You build little authority.',
          es: 'Generas mucho contenido. Construyes poca autoridad.',
        },
        solution: {
          en: 'Each post reinforces a brand pillar. Consistency is the system.',
          es: 'Cada post refuerza un pilar de marca. La consistencia es el sistema.',
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
      en: "Noctra Social doesn't generate generic posts. It generates content calibrated to your tone, audience and brand pillars.",
      es: 'Noctra Social no genera posts genéricos. Genera contenido calibrado a tu tono, tu audiencia y tus pilares de marca.',
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
          en: 'Define your tone, values, platform audience and content pillars. The AI uses them as the base of every generation.',
          es: 'Define tu tono, valores, audiencia por plataforma y pilares de contenido. La IA los usa como base en cada generación.',
        },
        title: {
          en: 'Configure your brand voice',
          es: 'Configura tu voz de marca',
        },
      },
      {
        body: {
          en: 'Save any thought with the floating button. The app organizes it in your idea bank.',
          es: 'Guarda cualquier pensamiento con el botón flotante. La app los organiza en tu banco de ideas.',
        },
        title: {
          en: 'Capture ideas',
          es: 'Captura ideas',
        },
      },
      {
        body: {
          en: 'Choose the mode you need: AI idea suggestions, develop your idea or go straight to the editor. Select platform, angle and generate.',
          es: 'Elige el modo que necesitas: que la IA sugiera ideas, que desarrolle la tuya, o acceso directo al editor. Selecciona plataforma, ángulo y genera.',
        },
        title: {
          en: 'Generate with criteria',
          es: 'Genera con criterio',
        },
      },
      {
        body: {
          en: 'The content is formatted for each platform. Export ZIP, TXT or PDF depending on the format you need.',
          es: 'El contenido sale formateado para cada plataforma. Exporta el ZIP, TXT o PDF según el formato que necesitas.',
        },
        title: {
          en: 'Review and export',
          es: 'Revisa y exporta',
        },
      },
      {
        body: {
          en: 'Rate every post. The AI extracts learnings and improves the next generations with your real history.',
          es: 'Califica cada post. La IA extrae aprendizajes y mejora las siguientes generaciones con tu historial real.',
        },
        title: {
          en: 'The system learns',
          es: 'El sistema aprende',
        },
      },
    ] satisfies Step[],
  },
  features: {
    heading: {
      en: 'Designed to build brand presence with discipline.',
      es: 'Diseñado para construir presencia de marca con disciplina.',
    },
    label: {
      en: 'CAPABILITIES',
      es: 'CAPACIDADES',
    },
    items: [
      {
        description: {
          en: 'Every post uses your tone, values and forbidden words. The content always sounds like you.',
          es: 'Cada post usa tu tono, valores y palabras prohibidas. El contenido siempre suena como tú.',
        },
        icon: 'message',
        title: {
          en: 'Persistent brand voice',
          es: 'Voz de marca persistente',
        },
      },
      {
        description: {
          en: 'Define up to 4 thematic territories. The calendar shows whether your content is balanced.',
          es: 'Define hasta 4 territorios temáticos. El calendario muestra si tu contenido está balanceado.',
        },
        icon: 'layers',
        title: {
          en: 'Content pillars',
          es: 'Pilares de contenido',
        },
      },
      {
        description: {
          en: 'Set who reads you on each network. The AI calibrates technical depth, examples and CTA for each audience.',
          es: 'Configura quién te lee en cada red. La IA calibra tecnicidad, ejemplos y CTA para cada audiencia.',
        },
        icon: 'users',
        title: {
          en: 'Audience by platform',
          es: 'Audiencia por plataforma',
        },
      },
      {
        description: {
          en: 'No idea, partial idea or direct editor. The app adapts to how you arrive each day.',
          es: 'Sin idea, con idea, o directo al editor. La app se adapta a cómo llegas cada día.',
        },
        icon: 'sparkles',
        title: {
          en: 'Three generation modes',
          es: 'Tres modos de generación',
        },
      },
      {
        description: {
          en: 'Plan the week, repurpose posts or generate case studies and thought leadership with one click.',
          es: 'Planea la semana, repurpose posts, genera casos de estudio o thought leadership con un clic.',
        },
        icon: 'lightning',
        title: {
          en: 'Quick actions',
          es: 'Acciones rápidas',
        },
      },
      {
        description: {
          en: 'Instagram: ZIP with slides and suggested audio. X: numbered TXT. LinkedIn: carousel PDF.',
          es: 'Instagram: ZIP con slides y audio sugerido. X: TXT numerado. LinkedIn: PDF de carrusel.',
        },
        icon: 'folder',
        title: {
          en: 'Publish-ready export',
          es: 'Exportación lista para publicar',
        },
      },
      {
        description: {
          en: 'Weekly and monthly view with drag and drop. Schedule, move and balance pillars visually.',
          es: 'Vista semanal y mensual con drag & drop. Programa, mueve y balancea pilares visualmente.',
        },
        icon: 'calendar',
        title: {
          en: 'Editorial calendar',
          es: 'Calendario editorial',
        },
      },
      {
        description: {
          en: 'Every rating feeds the system. After 5 posts with feedback, quality improves noticeably.',
          es: 'Cada rating alimenta el sistema. Después de 5 posts con feedback, la calidad mejora notablemente.',
        },
        icon: 'brain',
        title: {
          en: 'AI that learns',
          es: 'IA que aprende',
        },
      },
      {
        description: {
          en: "Capture thoughts before they escape. Filter them by platform, status and pillar.",
          es: 'Captura pensamientos antes de que se escapen. Fíltralos por plataforma, estado y pilar.',
        },
        icon: 'target',
        title: {
          en: 'Idea bank',
          es: 'Banco de ideas',
        },
      },
    ] satisfies Feature[],
  },
  comparison: {
    columns: {
      chatgpt: {
        en: 'Direct ChatGPT',
        es: 'ChatGPT directo',
      },
      generic: {
        en: 'Generic tool',
        es: 'Herramienta genérica',
      },
      noctra: 'Noctra Social',
    },
    heading: {
      en: 'Not another post generator.',
      es: 'No es otro generador de posts.',
    },
    label: {
      en: 'COMPARISON',
      es: 'COMPARATIVA',
    },
    rows: [
      {
        label: {
          en: 'Persistent brand voice',
          es: 'Voz de marca persistente',
        },
        values: { chatgpt: 'no', generic: 'no', noctra: 'yes' },
      },
      {
        label: {
          en: 'Content pillars',
          es: 'Pilares de contenido',
        },
        values: { chatgpt: 'no', generic: 'no', noctra: 'yes' },
      },
      {
        label: {
          en: 'Audience by platform',
          es: 'Audiencia por plataforma',
        },
        values: { chatgpt: 'no', generic: 'no', noctra: 'yes' },
      },
      {
        label: {
          en: 'Native formats by network',
          es: 'Formatos nativos por red',
        },
        values: { chatgpt: 'manual', generic: 'partial', noctra: 'yes' },
      },
      {
        label: {
          en: 'Publish-ready export',
          es: 'Exportación lista para publicar',
        },
        values: { chatgpt: 'no', generic: 'no', noctra: 'yes' },
      },
      {
        label: {
          en: 'AI learns from history',
          es: 'IA que aprende de tu historial',
        },
        values: { chatgpt: 'no', generic: 'no', noctra: 'yes' },
      },
      {
        label: {
          en: 'Editorial calendar',
          es: 'Calendario editorial',
        },
        values: { chatgpt: 'no', generic: 'separate', noctra: 'yes' },
      },
      {
        label: {
          en: 'Integrated idea bank',
          es: 'Banco de ideas integrado',
        },
        values: { chatgpt: 'no', generic: 'no', noctra: 'yes' },
      },
    ] satisfies ComparisonRow[],
    subheading: {
      en: 'The difference is whether the AI knows your brand or just receives an empty prompt each time.',
      es: 'La diferencia está en si la IA conoce tu marca o solo recibe un prompt vacío cada vez.',
    },
  },
  forWho: {
    cards: [
      {
        challenge: {
          en: 'They need consistent presence without a content team or spare hours.',
          es: 'Necesitan presencia consistente sin un equipo de contenido ni horas disponibles.',
        },
        challengeLabel: {
          en: 'Challenge',
          es: 'Reto',
        },
        solution: {
          en: 'Noctra Social generates, organizes and exports in a single weekly session.',
          es: 'Noctra Social genera, organiza y exporta en una sola sesión semanal.',
        },
        solutionLabel: {
          en: 'Response',
          es: 'Solución',
        },
        title: {
          en: 'Founders and solopreneurs',
          es: 'Fundadores y solopreneurs',
        },
      },
      {
        challenge: {
          en: 'They produce content for multiple clients with different voices and audiences.',
          es: 'Producen contenido para múltiples clientes con voces y audiencias distintas.',
        },
        challengeLabel: {
          en: 'Challenge',
          es: 'Reto',
        },
        solution: {
          en: 'Each profile has its own brand voice, pillars and audience setup.',
          es: 'Cada perfil tiene su propia voz de marca, pilares y configuración de audiencia.',
        },
        solutionLabel: {
          en: 'Response',
          es: 'Solución',
        },
        title: {
          en: 'Digital agencies',
          es: 'Agencias digitales',
        },
      },
      {
        challenge: {
          en: "They want to position themselves as references but don't know how to structure the content.",
          es: 'Quieren posicionarse como referentes pero no saben cómo estructurar el contenido.',
        },
        challengeLabel: {
          en: 'Challenge',
          es: 'Reto',
        },
        solution: {
          en: 'The pillar system and quick actions guide what to publish, when and for whom.',
          es: 'El sistema de pilares y las acciones rápidas guían qué publicar, cuándo y para quién.',
        },
        solutionLabel: {
          en: 'Response',
          es: 'Solución',
        },
        title: {
          en: 'Independent professionals',
          es: 'Profesionales independientes',
        },
      },
      {
        challenge: {
          en: 'They coordinate content across several people without losing voice consistency.',
          es: 'Coordinan contenido entre varias personas sin perder consistencia de voz.',
        },
        challengeLabel: {
          en: 'Challenge',
          es: 'Reto',
        },
        note: {
          en: 'Coming soon',
          es: 'Próximamente',
        },
        solution: {
          en: 'One brand configuration that every generator uses as a base.',
          es: 'Una sola configuración de marca que todos los generadores usan como base.',
        },
        solutionLabel: {
          en: 'Response',
          es: 'Solución',
        },
        title: {
          en: 'Marketing teams',
          es: 'Equipos de marketing',
        },
      },
    ] satisfies AudienceCard[],
    heading: {
      en: 'For those who build brand with intention.',
      es: 'Para quien construye marca con intención.',
    },
    label: {
      en: 'WHO IT IS FOR',
      es: 'PARA QUIÉN',
    },
  },
  pricing: {
    badge: {
      en: 'Private access',
      es: 'Acceso privado',
    },
    button: {
      en: 'Request access',
      es: 'Solicitar acceso',
    },
    heading: {
      en: 'Early access — internal use.',
      es: 'Acceso anticipado — uso interno.',
    },
    label: {
      en: 'PRICING',
      es: 'PRECIOS',
    },
    note: {
      en: 'Noctra Social is currently in internal use. If you want early access for your brand or agency, reach out directly.',
      es: 'Noctra Social está actualmente en uso interno. Si quieres acceso anticipado para tu marca o agencia, escríbenos directamente.',
    },
    responseTime: {
      en: 'Reply in under 48 hours.',
      es: 'Respuesta en menos de 48 horas.',
    },
    subtitle: {
      en: 'AI-native brand content system',
      es: 'Sistema de contenido de marca nativo en IA',
    },
    title: 'Noctra Social',
  },
  faq: {
    heading: {
      en: 'What people usually ask before requesting access.',
      es: 'Lo que suelen preguntar antes de solicitar acceso.',
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
          en: 'Instagram exports a ZIP with the caption, slide structure and audio suggestion. X exports a TXT with the numbered thread. LinkedIn exports a ZIP with the upload-ready carousel PDF and the caption separately.',
          es: 'Instagram exporta un ZIP con el caption, estructura de slides y sugerencia de audio. X exporta un TXT con el hilo numerado. LinkedIn exporta un ZIP con el PDF de carrusel listo para subir y el caption por separado.',
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
          en: 'Anthropic (claude-sonnet) for text generation, Gemini Imagen 3 for visual generation and image scoring, and Unsplash for photo search. Everything runs on Next.js with Supabase as the database.',
          es: 'Anthropic (claude-sonnet) para generación de texto, Gemini Imagen 3 para generación visual y scoring de imágenes, y Unsplash para búsqueda fotográfica. Todo corre en Next.js con Supabase como base de datos.',
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
      en: 'Request access',
      es: 'Solicitar acceso',
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
        en: 'Most B2B brands do not need more volume. They need clearer repetition. Repeat one operating principle until the market can say it back to you.',
        es: 'La mayoría de marcas B2B no necesita más volumen. Necesita repetición clara. Repite un principio operativo hasta que el mercado pueda devolvértelo con sus palabras.',
      },
      exportLabel: {
        en: 'Export ZIP',
        es: 'Exportar ZIP',
      },
      footer: {
        en: '8 slides · audio suggestion · authority pillar',
        es: '8 slides · audio sugerido · pilar autoridad',
      },
      hook: {
        en: 'Authority does not come from publishing more. It comes from saying one sharp thing often enough.',
        es: 'La autoridad no sale de publicar más. Sale de decir una idea precisa las veces necesarias.',
      },
      id: 'instagram',
      label: 'Instagram',
    },
    {
      badge: {
        en: 'Document post',
        es: 'Post tipo documento',
      },
      body: {
        en: 'Your category does not need another trend summary. It needs a point of view with operating details, tradeoffs and examples from the work you already do.',
        es: 'Tu categoría no necesita otro resumen de tendencias. Necesita un punto de vista con detalles operativos, tradeoffs y ejemplos del trabajo que ya haces.',
      },
      exportLabel: {
        en: 'Export PDF',
        es: 'Exportar PDF',
      },
      footer: {
        en: '12 pages · founder voice · CTA to call',
        es: '12 páginas · voz fundador · CTA a llamada',
      },
      hook: {
        en: 'If your content sounds like everyone else in the category, the market assumes your service works the same way too.',
        es: 'Si tu contenido suena igual al resto de la categoría, el mercado asume que tu servicio funciona igual también.',
      },
      id: 'linkedin',
      label: 'LinkedIn',
    },
    {
      badge: {
        en: 'Thread draft',
        es: 'Borrador de hilo',
      },
      body: {
        en: 'Three observations. One take. No filler. The thread is built to open with tension, move with rhythm and end with a useful stance.',
        es: 'Tres observaciones. Una postura. Sin relleno. El hilo abre con tensión, avanza con ritmo y cierra con una idea útil.',
      },
      exportLabel: {
        en: 'Export TXT',
        es: 'Exportar TXT',
      },
      footer: {
        en: '7 posts · numbered thread · CTA to article',
        es: '7 posts · hilo numerado · CTA a artículo',
      },
      hook: {
        en: 'Most brand accounts on X confuse noise with presence. Precision still wins.',
        es: 'La mayoría de cuentas de marca en X confunde ruido con presencia. La precisión sigue ganando.',
      },
      id: 'x',
      label: 'X',
    },
  ] satisfies PlatformPreview[],
}

export function getComparisonValueLabel(
  locale: LandingLocale,
  value: ComparisonValue
) {
  switch (value) {
    case 'yes':
      return '✓'
    case 'partial':
      return locale === 'es' ? 'Parcial' : 'Partial'
    case 'separate':
      return locale === 'es' ? 'Separado' : 'Separate tool'
    case 'manual':
      return locale === 'es' ? 'Manual' : 'Manual'
    case 'no':
    default:
      return '✗'
  }
}
