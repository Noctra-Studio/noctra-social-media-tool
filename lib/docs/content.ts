import type { DocPage, DocNavItem } from './types'

export const DOC_NAV: DocNavItem[] = [
  {
    slug: 'primeros-pasos',
    label: 'Primeros pasos',
    labelEn: 'Getting started',
    icon: 'Package',
    group: 'General'
  },
  {
    slug: 'configuracion-cuenta',
    label: 'Configuración de cuenta',
    labelEn: 'Account settings',
    icon: 'Settings2',
    group: 'General'
  },
  {
    slug: 'crear-publicaciones',
    label: 'Crear publicaciones',
    labelEn: 'Creating posts',
    icon: 'FileText',
    group: 'Contenido'
  },
  {
    slug: 'conectar-redes-sociales',
    label: 'Conectar redes sociales',
    labelEn: 'Connect social networks',
    icon: 'Share2',
    badge: 'APIs',
    group: 'Contenido'
  },
]

export const DOC_PAGES_ES: Record<string, DocPage> = {
  'primeros-pasos': {
    slug: 'primeros-pasos',
    title: 'Primeros pasos',
    subtitle: 'De la invitación a tu primer post en menos de 10 minutos.',
    callout: {
      type: 'info',
      content: '<strong>Early Access:</strong> Tu cuenta fue activada manualmente por el equipo de Noctra Studio. Si tienes preguntas, escríbenos a hello@noctra.studio'
    },
    sections: [
      {
        title: 'Flujo de configuración',
        steps: [
          {
            title: 'Acepta tu invitación',
            description: 'Recibirás un email de Noctra Social. Haz clic en "Configurar contraseña" y define tu acceso.'
          },
          {
            title: 'Completa el onboarding',
            description: 'Configura tu marca: logo, tono de voz, pilares de contenido y objetivo principal. La IA necesita este contexto para generar contenido que suene como tú.'
          },
          {
            title: 'Crea tu primer post',
            description: 'Ve a Crear → elige una plataforma → selecciona un pilar de contenido → genera tu primer borrador con IA.'
          },
          {
            title: 'Conecta tus redes (opcional)',
            description: 'Conecta Instagram, LinkedIn o X para obtener métricas reales y activar el aprendizaje automático de la IA.'
          },
        ]
      }
    ]
  },

  'configuracion-cuenta': {
    slug: 'configuracion-cuenta',
    title: 'Configuración de cuenta',
    subtitle: 'Ajusta tu workspace para que la IA entienda tu marca a la perfección.',
    sections: [
      {
        title: 'Secciones de configuración',
        steps: [
          {
            title: 'Marca — Logo e identidad visual',
            description: 'Sube tu logo (PNG, SVG hasta 5MB). Se usa en carruseles y exportaciones. Ve a Configuración → Marca.'
          },
          {
            title: 'Voz de marca',
            description: 'Define tono, valores, palabras prohibidas y posts de referencia. Cuanto más detallado, mejor calibrada queda la IA. La voz de marca se inyecta en cada generación.'
          },
          {
            title: 'Estrategia y pilares de contenido',
            description: 'Define hasta 4 pilares temáticos. Cada post se etiqueta con un pilar, lo que permite medir qué temas generan más engagement y mantener un balance editorial.'
          },
          {
            title: 'Nivel de asistencia',
            description: 'Elige entre: solo ideas / borradores para editar / contenido casi autónomo. Puedes cambiarlo en cualquier momento desde Configuración → Estilo.'
          },
          {
            title: 'Audiencia por plataforma',
            description: 'En Configuración → Estrategia, define quién te lee en cada red, sus pain points y su nivel técnico. Esto personaliza el lenguaje de cada post por plataforma.'
          },
        ]
      }
    ]
  },

  'crear-publicaciones': {
    slug: 'crear-publicaciones',
    title: 'Crear publicaciones',
    subtitle: 'Genera, edita y exporta contenido listo para publicar en cada plataforma.',
    sections: [
      {
        title: 'Paso a paso',
        steps: [
          {
            title: 'Ve a Crear en el menú lateral',
            description: 'Elige el modo: "No sé qué publicar", "Tengo una idea" o "Sé exactamente qué quiero". Cada modo adapta la experiencia al nivel de definición que tienes.'
          },
          {
            title: 'Selecciona plataforma y pilar',
            description: 'Cada plataforma tiene reglas distintas. Instagram favorece storytelling visual; LinkedIn requiere mayor profundidad; X prefiere concisión y ganchos directos.'
          },
          {
            title: 'Genera con IA',
            description: 'La IA aplica tu voz de marca, el pilar seleccionado y los insights aprendidos de tus posts anteriores. El resultado es un borrador completo con texto, hashtags y CTA.'
          },
          {
            title: 'Edita y ajusta',
            description: 'Ajusta el texto directamente en el editor, regenera secciones específicas o cambia el tono con un clic. El historial de versiones guarda cada generación.'
          },
          {
            title: 'Exporta en el formato correcto',
            description: 'Instagram: ZIP con imagen y caption. X: TXT formateado como hilo. LinkedIn: PDF listo para adjuntar. Los formatos se generan automáticamente.'
          },
          {
            title: 'Publica manualmente y registra el ID',
            description: 'Publica desde la app nativa de cada plataforma. Luego regresa a Noctra Social, marca el post como publicado y pega la URL del post para activar el seguimiento de métricas.'
          },
        ]
      },
      {
        title: 'Buenas prácticas por plataforma',
        steps: [
          {
            title: 'Instagram',
            description: 'El caption ideal es entre 150-300 palabras. El primer renglón es el gancho — debe ser lo suficientemente atractivo para que el usuario haga "más". Usa saltos de línea para mejorar la legibilidad.'
          },
          {
            title: 'LinkedIn',
            description: 'El algoritmo premia las primeras 3 líneas — ahí va tu idea central. Los posts de 800-1200 palabras tienen mayor alcance orgánico. Evita URLs en el cuerpo del post; ponlas en los comentarios.'
          },
          {
            title: 'X (Twitter)',
            description: 'Un hilo de 3-5 tweets supera consistentemente al tweet único. El primer tweet define si el usuario hace clic en "mostrar hilo". Termina con una pregunta o CTA concreta.'
          },
        ]
      }
    ]
  },

  'conectar-redes-sociales': {
    slug: 'conectar-redes-sociales',
    title: 'Conectar redes sociales',
    subtitle: 'Cómo vincular tus cuentas para obtener métricas y activar el aprendizaje de la IA.',
    callout: {
      type: 'info',
      content: '<strong>Nota:</strong> Noctra Studio no gestiona este proceso por ti — cada plataforma requiere que el dueño de la cuenta cree y configure su propia app de desarrollador. Esta guía te explica cómo hacerlo paso a paso.'
    },
    sections: [
      {
        title: '¿Para qué sirve conectar mis cuentas?',
        steps: [
          {
            title: 'Métricas reales de tus publicaciones',
            description: 'Noctra Social obtiene impresiones, alcance, engagement y guardados directamente de cada plataforma, sin que tengas que ingresar los datos manualmente.'
          },
          {
            title: 'Aprendizaje automático de la IA',
            description: 'Con métricas reales, la IA analiza qué tipos de posts, pilares de contenido y formatos funcionan mejor para tu audiencia específica y aplica esos patrones en futuras generaciones.'
          },
        ]
      },
      {
        title: 'Instagram / Meta — Paso a paso',
        steps: [
          {
            title: 'Crea una Meta App',
            description: 'Ve a developers.facebook.com → My Apps → Create App → selecciona "Consumer". Necesitas una cuenta de Facebook conectada a tu cuenta de Instagram Business.'
          },
          {
            title: 'Activa Instagram Graph API',
            description: 'Dentro de tu app, ve a "Add a Product" → Instagram Graph API. Solicita los permisos: instagram_basic e instagram_manage_insights.'
          },
          {
            title: 'Agrega la Redirect URI',
            description: 'En App Settings → Basic, agrega: social.noctra.studio/api/auth/social/instagram/callback — sin esta URL, el flujo OAuth fallará.'
          },
          {
            title: 'Conecta en Noctra Social',
            description: 'Ve a Configuración → Cuentas → Instagram → "Conectar cuenta". Noctra Social completa el flujo OAuth automáticamente y guarda tu token de forma segura.'
          },
        ]
      },
      {
        title: 'LinkedIn — Paso a paso',
        steps: [
          {
            title: 'Crea una app en linkedin.com/developers',
            description: 'Ve a My Apps → Create App. Necesitas una página de empresa en LinkedIn (no un perfil personal) para asociar la app. Si no tienes una página, créala primero desde linkedin.com/company/setup/new.'
          },
          {
            title: 'Solicita los productos correctos',
            description: 'En la pestaña Products, solicita: "Share on LinkedIn" y "Marketing Developer Platform". El segundo requiere aprobación manual de LinkedIn — puede tomar entre 1 y 3 días hábiles.'
          },
          {
            title: 'Agrega la Redirect URI',
            description: 'En Auth → OAuth 2.0 settings: social.noctra.studio/api/auth/social/linkedin/callback'
          },
          {
            title: 'Conecta en Noctra Social',
            description: 'Ve a Configuración → Cuentas → LinkedIn → "Conectar cuenta". Autoriza los permisos solicitados y regresa automáticamente al dashboard.'
          },
        ]
      },
      {
        title: 'X (Twitter) — Paso a paso',
        steps: [
          {
            title: 'Crea un proyecto en developer.twitter.com',
            description: 'Ve a Developer Portal → Projects → Add Project. Dentro del proyecto, crea una App. Elige "OAuth 2.0" como método de autenticación (no OAuth 1.0a).'
          },
          {
            title: 'Configura los scopes',
            description: 'Los scopes necesarios son: tweet.read, users.read y offline.access. El scope offline.access permite que el token se renueve automáticamente sin que tengas que reconectar cada 2 horas.'
          },
          {
            title: 'Agrega la Redirect URI',
            description: 'En App Settings → User authentication settings: social.noctra.studio/api/auth/social/x/callback'
          },
          {
            title: 'Conecta en Noctra Social',
            description: 'Ve a Configuración → Cuentas → X → "Conectar cuenta". Inicia sesión con tu cuenta de X y autoriza los permisos solicitados.'
          },
        ]
      },
      {
        title: 'Sincronización de métricas',
        steps: [
          {
            title: 'Sincronización manual',
            description: 'Una vez conectada una cuenta, ve a Configuración → Cuentas y haz clic en "Sincronizar" para obtener las métricas más recientes de tus posts publicados.'
          },
          {
            title: 'Sincronización automática',
            description: 'Noctra Social sincroniza métricas automáticamente cada lunes. Los insights de la IA se actualizan después de cada sincronización cuando tienes al menos 3 posts publicados con métricas.'
          },
        ]
      }
    ]
  },
}

export const DOC_PAGES_EN: Record<string, DocPage> = {
  // English version - same structure for future translation
}
