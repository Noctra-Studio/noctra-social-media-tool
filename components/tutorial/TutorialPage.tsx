'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  Brain,
  Briefcase,
  CalendarDays,
  Flame,
  MessageCircleQuestion,
  PenLine,
  RefreshCcw,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { CollapsibleTip } from '@/components/tutorial/CollapsibleTip'
import { OnboardingChecklist } from '@/components/tutorial/OnboardingChecklist'
import { PlatformRulesTable } from '@/components/tutorial/PlatformRulesTable'
import { PromptTemplateCard } from '@/components/tutorial/PromptTemplateCard'
import { SectionNav } from '@/components/tutorial/SectionNav'

type TutorialSectionId =
  | 'primeros-pasos'
  | 'generar-posts'
  | 'instagram'
  | 'x-twitter'
  | 'linkedin'
  | 'imagenes'
  | 'voz-de-marca'
  | 'audiencia'
  | 'acciones-rapidas'
  | 'flujo-semanal'

type SectionDefinition = {
  id: TutorialSectionId
  title: string
}

type PlatformRule = {
  element: string
  rule: string
}

const sections: SectionDefinition[] = [
  { id: 'primeros-pasos', title: 'Primeros pasos' },
  { id: 'generar-posts', title: 'Cómo generar posts' },
  { id: 'instagram', title: 'Instagram' },
  { id: 'x-twitter', title: 'X (Twitter)' },
  { id: 'linkedin', title: 'LinkedIn' },
  { id: 'imagenes', title: 'Imágenes que funcionan' },
  { id: 'voz-de-marca', title: 'Voz de marca' },
  { id: 'audiencia', title: 'Construcción de audiencia' },
  { id: 'acciones-rapidas', title: 'Acciones rápidas' },
  { id: 'flujo-semanal', title: 'Flujo semanal recomendado' },
]

const checklistItems = [
  {
    id: 'voice',
    label: 'Configura tu Voz de marca',
    description:
      'Define tu tono, valores y palabras prohibidas. Esto es lo que hace que el contenido suene como tu, no como IA generica.',
    href: '/settings?tab=voice',
    linkLabel: 'Ir a Voz de marca →',
  },
  {
    id: 'references',
    label: 'Agrega al menos 2 posts de referencia',
    description:
      'Pega posts reales que hayas escrito o que representen tu estilo. La IA los usa como calibracion.',
    href: '/settings?tab=voice',
    linkLabel: 'Ir a Posts de referencia →',
  },
  {
    id: 'idea',
    label: 'Captura tu primera idea',
    description:
      'Usa el boton + para guardar cualquier pensamiento. No tiene que ser perfecto.',
    href: '/ideas',
    linkLabel: 'Ir a Ideas →',
  },
  {
    id: 'generate',
    label: 'Genera tu primer post',
    description:
      'Prueba el Modo B: escribe una idea y deja que la IA sugiera 4 angulos distintos.',
    href: '/compose',
    linkLabel: 'Ir a Crear →',
  },
  {
    id: 'feedback',
    label: 'Dale feedback a tu primer post generado',
    description:
      'Rating de 1-5 estrellas. Con cada feedback la IA mejora.',
  },
]

const generateModes = [
  {
    title: 'No se que publicar',
    icon: Sparkles,
    whenToUse: 'Cuando abres la app sin una idea clara.',
    howItWorks: [
      'Selecciona una plataforma.',
      'La IA sugiere 3 ideas basadas en tu historial, ideas guardadas y tendencias del sector.',
      'Haz clic en la que mas te llame y pasa al Modo B.',
    ],
    proTip: 'Usalo los lunes para planear la semana.',
  },
  {
    title: 'Tengo una idea',
    icon: PenLine,
    whenToUse: 'Tienes un tema pero no sabes como estructurarlo.',
    howItWorks: [
      'Escribe tu idea en el campo de texto.',
      "Haz clic en 'Sugerir angulos'.",
      'Elige entre: Opinion / Tutorial / Historia / Dato.',
      'Genera y revisa el resultado.',
    ],
    proTip:
      "El angulo 'Historia' genera el mayor engagement en LinkedIn. El angulo 'Dato' funciona mejor en X.",
  },
  {
    title: 'Se lo que quiero',
    icon: Zap,
    whenToUse: 'Sabes exactamente el formato y tema.',
    howItWorks: [
      'Selecciona plataforma + angulo directamente.',
      'Escribe la idea.',
      'Genera sin pasos intermedios.',
    ],
    proTip: 'Ideal cuando ya tienes practica y solo necesitas acelerar la redaccion.',
  },
]

const instagramRules: PlatformRule[] = [
  { element: 'Caption', rule: 'Max 150 palabras. Hook en las primeras 2 lineas (lo que se ve antes del "mas").' },
  { element: 'Hashtags', rule: '5-10. Mezcla: nicho + general + marca.' },
  { element: 'Formato', rule: 'Publicacion unica o Carrusel (3-10 slides).' },
  { element: 'Mejor horario', rule: 'Mar-Vie, 11am-1pm o 7pm-9pm hora local.' },
  { element: 'Imagen', rule: 'Indispensable. Ratio 1:1 o 4:5.' },
]

const xRules: PlatformRule[] = [
  { element: 'Tweet unico', rule: 'Max 270 chars (reserva para numeracion).' },
  { element: 'Hilo', rule: '4-8 tweets. Cada uno debe funcionar solo.' },
  { element: 'Articulo', rule: '600-900 palabras. Markdown soportado.' },
  { element: 'Hashtags', rule: 'Max 2, solo si son muy relevantes.' },
  { element: 'Imagenes', rule: 'Opcionales. Ratio 16:9.' },
  { element: 'Mejor horario', rule: 'Lun-Jue, 8-10am o 12-1pm.' },
]

const linkedinRules: PlatformRule[] = [
  { element: 'Longitud', rule: '150-250 palabras. Parrafos de 1-3 lineas.' },
  { element: 'Hashtags', rule: 'Max 5. Al final del post, no en el texto.' },
  { element: 'Saltos de linea', rule: 'Cada 2-3 oraciones. LinkedIn los respeta.' },
  { element: 'Documento PDF', rule: 'Carrusel subido como PDF (3-15 paginas).' },
  { element: 'Imagen', rule: 'Recomendada. Ratio 1.91:1.' },
  { element: 'Mejor horario', rule: 'Mar-Jue, 8-10am o 12-1pm.' },
]

const styleGuideRows = [
  ['Minimal', 'Posts de opinion, texto predominante', 'clean, negative space, mono'],
  ['Editorial', 'Casos de estudio, contenido de valor', 'editorial, magazine, sharp'],
  ['Abstract', 'Conceptos intangibles (SEO, estrategia)', 'geometric, gradient, dark'],
  ['Photography', 'Posts mas humanos, narrativa', 'cinematic, moody, real'],
]

const volumeRows = [
  ['Instagram', '2/sem', '4/sem', '7/sem'],
  ['LinkedIn', '1/sem', '3/sem', '5/sem'],
  ['X', '3/sem', '5/sem', 'diario'],
]

const quickActions = [
  {
    icon: CalendarDays,
    name: 'Planear contenido',
    when: 'Los lunes, para organizar la semana.',
    generates:
      'N ideas distribuidas por plataforma y angulo, listas para arrastrar al calendario.',
    tip: 'Empieza con 7 dias. Ajusta el plan segun lo que realmente publiques.',
  },
  {
    icon: RefreshCcw,
    name: 'Repurpose',
    when: 'Cuando un post funciono bien y quieres mas alcance con el mismo contenido.',
    generates:
      'Versiones adaptadas para las otras 2 plataformas, respetando sus reglas.',
    tip: 'El mejor contenido para repurpose es el que genero comentarios o guardados.',
  },
  {
    icon: Flame,
    name: 'Que esta viral',
    when: 'Cuando no sabes de que hablar pero quieres contenido relevante hoy.',
    generates: '5 ideas basadas en tendencias actuales del sector en LATAM, con urgency score.',
    tip: 'Usalo como inspiracion, no como guion. Siempre anade tu perspectiva.',
  },
  {
    icon: Briefcase,
    name: 'Caso de estudio',
    when: 'Cuando terminas un proyecto con un resultado concreto que puedes compartir.',
    generates: 'Post estructurado: hook → contexto → proceso → resultado → aprendizaje.',
    tip: "El resultado mas efectivo siempre tiene un numero: 'aumento 3x', 'redujo 2 semanas', 'ahorro $X'.",
  },
  {
    icon: Brain,
    name: 'Thought Leadership',
    when: 'Cuando tienes una opinion sobre algo del sector y quieres posicionarte como referente.',
    generates: 'Post con postura clara, argumento LATAM-especifico, sin caer en pitch comercial.',
    tip: "Si dejas el campo 'postura' vacio, la IA toma una postura contracorriente por ti.",
  },
  {
    icon: MessageCircleQuestion,
    name: 'FAQ de clientes',
    when: 'Cuando recibes las mismas preguntas por WhatsApp una y otra vez.',
    generates: 'Posts educativos que responden esas preguntas sin sonar a publicidad.',
    tip: 'Las mejores preguntas son las que revelan una creencia incorrecta del cliente.',
  },
]

const promptWritingTips = [
  'Siempre define plataforma, formato, audiencia y objetivo antes del tema.',
  'Pide una postura clara para evitar texto tibio o demasiado neutral.',
  'Añade restricciones concretas: longitud, tono, hooks, CTA y palabras prohibidas.',
  'Incluye contexto local: Mexico, LATAM, Querataro, tipo de cliente o industria.',
  'Para imagenes, describe sujeto, composicion, luz, textura, encuadre y que NO quieres ver.',
]

const instagramContentPrompt = `Actua como estratega de contenido para una marca creativa premium en LATAM.

Quiero un post para Instagram.

Datos base:
- Marca: Noctra
- Tema central: [TEMA]
- Objetivo del post: [educar / generar DMs / posicionar autoridad / anunciar algo]
- Audiencia: [tipo de cliente ideal]
- Angulo: [opinion / tutorial / historia / dato]
- Tesis o postura: [QUE QUIERO DEFENDER]
- Nivel de awareness del lector: [frio / tibio / caliente]

Instrucciones:
- Escribe en espanol LATAM.
- Tono: directo, claro, elegante, sin humo, sin lenguaje corporativo vacio.
- No uses estas palabras: innovacion, soluciones integrales, sinergia, ecosistema digital, transformacion digital.
- Crea un hook fuerte en las primeras 2 lineas.
- Longitud maxima: 150 palabras.
- El caption debe sentirse humano, preciso y publicable sin grandes ediciones.
- Incluye una CTA breve al final que invite comentario o guardado.
- Sugiere 7 hashtags: 3 de nicho, 3 generales y 1 de marca.

Formato de salida:
1. Hook
2. Caption completo
3. CTA
4. Hashtags
5. Idea de portada o primer slide que genere curiosidad.`

const instagramImagePrompt = `Genera una imagen editorial para Instagram 4:5 para una marca premium llamada Noctra.

Objetivo visual:
- Tema: [TEMA]
- Sensacion que debe transmitir: [claridad / autoridad / tension / curiosidad / calma / sofisticacion]
- Audiencia: [tipo de cliente]

Direccion de arte:
- Estilo: editorial oscuro, minimalista, cinematografico, premium, alto contraste.
- Composicion: clara, con un punto focal fuerte y espacio negativo util para overlay si hace falta.
- Paleta: negros profundos, grises grafito, acentos frios o neutros; evitar colores saturados baratos.
- Iluminacion: dramatica, controlada, con sombras suaves o luz lateral.
- Textura: limpia, refinada, nada plastica.

Evita:
- Stock generico de oficina.
- Personas sonriendo a camara.
- Laptop sobre escritorio blanco minimalista.
- Estetica de anuncio barato o mockup corporativo.

Entrega la escena como si fuera portada de revista o visual para una marca de consultoria creativa de alto nivel en LATAM.`

const xContentPrompt = `Actua como ghostwriter senior para X (Twitter) para una marca llamada Noctra.

Necesito un hilo de 5 a 7 tweets sobre: [TEMA]

Contexto:
- Audiencia: [a quien le hablas]
- Objetivo: [autoridad / debate / awareness / trafico / leads]
- Postura: [QUE PIENSAS DE VERDAD]
- Insight clave: [la idea que quieres que la gente recuerde]
- Ejemplo o caso real: [si existe]

Instrucciones:
- Escribe en espanol LATAM.
- Cada tweet debe poder entenderse por si solo.
- El Tweet 1 debe funcionar como hook brutalmente claro y generar curiosidad inmediata.
- No uses intros debiles tipo "Hoy quiero hablar..." o "He estado pensando...".
- Usa frases cortas, ritmo agil y una postura nitida.
- Si conviene, incluye una analogia o contraste fuerte.
- Cierra el ultimo tweet con una idea memorable o una pregunta que abra conversacion.
- Maximo 270 caracteres por tweet.

Formato de salida:
Tweet 1:
Tweet 2:
Tweet 3:
...

Despues agrega:
- Por que el hook funciona
- 2 variantes alternativas solo para el Tweet 1.`

const xImagePrompt = `Genera una imagen 16:9 para acompanar un hilo de X de una marca premium llamada Noctra.

Tema: [TEMA]
Idea central del hilo: [INSIGHT]

Visual buscado:
- Debe frenar el scroll y sentirse inteligente, no decorativo.
- Estilo: high-contrast editorial, conceptual, moody, minimal tech.
- Composicion: una sola idea visual fuerte, sin ruido.
- Encadre: horizontal, limpio, con centro de interes claro.
- Puede usar arquitectura, ciudad nocturna, objetos de trabajo sofisticados o abstraccion geometrica segun el tema.

Evita:
- Imagenes literales demasiado obvias.
- Ilustracion cartoon.
- Stock tipico de marketing.
- Exceso de texto incrustado.

La imagen debe parecer de una publicacion aguda sobre estrategia, no de una campana promocional generica.`

const linkedinContentPrompt = `Actua como estratega de thought leadership para LinkedIn.

Escribe un post de LinkedIn para Noctra sobre: [TEMA]

Objetivo:
- Posicionar autoridad en: [AREA]
- Audiencia: [tipo de cliente o decision maker]
- Resultado que quiero provocar: [comentarios / guardados / DMs / reconocimiento]
- Postura exacta: [QUE CREO Y QUE CONTRADIGO]
- Referencia real: [caso, anecdota, observacion, numero]

Instrucciones:
- Espanol LATAM.
- Tono: directo, elegante, sin relleno, con criterio.
- Longitud: 180 a 240 palabras.
- Estructura con saltos de linea claros para feed de LinkedIn.
- Abre con una frase contundente de 1 linea.
- Desarrolla el problema con claridad, luego la postura, luego el aprendizaje.
- Evita listas vacias y frases de coach.
- No vendas de forma obvia; primero aporta criterio.
- Termina con una pregunta que invite respuesta inteligente.
- Agrega 4 hashtags maximo al final.

Formato:
[Hook 1 linea]

[Contexto]

[Desarrollo]

[Cierre / pregunta]

[Hashtags]`

const linkedinCarouselPrompt = `Actua como director editorial y copywriter para un carrusel PDF de LinkedIn.

Necesito un carrusel de 8 slides sobre: [TEMA]

Objetivo:
- Audiencia: [tipo de cliente]
- Resultado: [educar / generar guardados / leads / autoridad]
- Nivel de sofisticacion del lector: [basico / medio / avanzado]
- Idea principal: [TESIS]

Instrucciones:
- Cada slide debe tener un titulo corto y texto breve, claro y fuerte.
- Slide 1 debe ser una portada con una promesa o tension clara.
- Slides 2-7 deben desarrollar la idea paso a paso, con una progresion logica.
- Slide 8 debe cerrar con takeaway y CTA suave.
- Voz: Noctra, premium, clara, sin humo.
- Nada de texto excesivo por slide.

Entrega en este formato:
Slide 1
- Titulo:
- Texto:

Slide 2
- Titulo:
- Texto:

...

Al final agrega:
- Idea visual sugerida para la portada
- Frase para el post que acompana el PDF en LinkedIn.`

const linkedinImagePrompt = `Genera una imagen 1.91:1 para LinkedIn para una marca premium llamada Noctra.

Tema: [TEMA]
Tipo de pieza: [thought leadership / caso de estudio / insight de industria]
Sensacion: [autoridad serena / tension intelectual / claridad / sofisticacion]

Direccion visual:
- Estilo editorial premium, sobrio, de alto criterio.
- Debe sentirse como encabezado de articulo o portada de informe ejecutivo.
- Composicion horizontal con aire, orden y peso visual.
- Paleta oscura con contraste fino.
- Elementos permitidos: arquitectura, texturas materiales, ciudad nocturna, objetos de trabajo refinados, abstraccion geometrica elegante.

Evita:
- Sonrisas corporativas.
- Oficinas genericas.
- Estetica startup brillante o infantil.
- Colores chillones.

Debe verse relevante para founders, marketers y decision makers en LATAM.`

const visualPromptTips = [
  'Empieza por la funcion de la imagen: detener scroll, explicar, crear tension o dar contexto.',
  'Si quieres overlay, dilo en el prompt: "deja espacio negativo en la parte superior izquierda".',
  'Describe el mood con 2 o 3 palabras fuertes: cinematic, moody, editorial, restrained.',
  'Incluye al menos una lista de exclusiones para evitar stock generico.',
]

const timelineItems = [
  {
    day: 'LUNES',
    duration: '20 minutos',
    title: 'Planeacion semanal',
    steps: [
      "Usa 'Planear contenido' → 7 dias.",
      'Revisa las ideas sugeridas y selecciona las mejores.',
      'Arrastralas al calendario en los dias que quieras publicar.',
      'Resultado: tienes la semana mapeada, no tienes que improvisar cada dia.',
    ],
  },
  {
    day: 'MARTES o MIERCOLES',
    duration: '15 minutos',
    title: 'Generacion profunda — LinkedIn',
    steps: [
      'Genera el post de mayor valor de la semana (caso de estudio, thought leadership, o carrusel).',
      'Exporta el ZIP.',
      'Programa en tu herramienta de scheduling favorita o publica directo.',
      'Da feedback al post generado (2 minutos).',
    ],
  },
  {
    day: 'JUEVES',
    duration: '10 minutos',
    title: 'Contenido rapido — X',
    steps: [
      'Genera un hilo o tweet sobre algo que aprendiste u observaste esa semana.',
      'Exporta TXT, publica o programa.',
    ],
  },
  {
    day: 'VIERNES',
    duration: '10 minutos',
    title: 'Visual — Instagram',
    steps: [
      'Genera un post o carrusel para el fin de semana.',
      'Busca imagen en /visual o genera con Gemini.',
      'Exporta ZIP con caption + slides + selección de fondos.',
      'Sube a Instagram o programa.',
    ],
  },
  {
    day: 'CUALQUIER DIA',
    duration: '2 minutos',
    title: 'Captura rapida',
    steps: [
      'Cuando tengas una idea, observacion, o frase interesante: usa el boton + donde estes.',
      'No la desarrolles ahora, solo capturala.',
      'El lunes tendras material para la semana siguiente.',
    ],
  },
]

function getSectionIndex(activeSection: TutorialSectionId) {
  return sections.findIndex((section) => section.id === activeSection)
}

function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-[#2A3040] bg-[#212631]">
      {children}
    </div>
  )
}

function GenericTable({
  headers,
  rows,
}: {
  headers: string[]
  rows: string[][]
}) {
  return (
    <TableWrapper>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-[#101417] text-[12px] font-medium text-[#4E576A]">
            {headers.map((header) => (
              <th key={header} className="px-4 py-3">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row[0]} className={index % 2 === 0 ? 'bg-[#212631]' : 'bg-[#1A1F28]'}>
              {row.map((cell, cellIndex) => (
                <td
                  key={`${row[0]}-${cellIndex}`}
                  className={`px-4 py-3 align-top ${cellIndex === 0 ? 'font-medium text-[#E0E5EB]' : 'text-[#C5CBD6]'}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrapper>
  )
}

function SectionCard({
  id,
  title,
  subtitle,
  children,
  index,
}: {
  children: React.ReactNode
  id: TutorialSectionId
  index: number
  subtitle?: string
  title: string
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.45, ease: 'easeOut' }}
      className="scroll-mt-28 rounded-[28px] border border-[#2A3040] bg-[#212631] p-6 md:p-10"
    >
      <div className="mb-8 space-y-2">
        <h2
          className="text-[30px] font-medium tracking-[-0.03em] text-[#E0E5EB] md:text-[34px]"
          style={{ fontFamily: 'var(--font-brand-display, var(--font-inter), sans-serif)' }}
        >
          {title}
        </h2>
        {subtitle ? <p className="max-w-2xl text-[#99A2B2]">{subtitle}</p> : null}
      </div>

      <div className="space-y-8">{children}</div>
    </motion.section>
  )
}

export function TutorialPage() {
  const [activeSection, setActiveSection] = useState<TutorialSectionId>('primeros-pasos')
  const ratiosRef = useRef<Record<TutorialSectionId, number>>({
    'primeros-pasos': 0,
    'generar-posts': 0,
    instagram: 0,
    'x-twitter': 0,
    linkedin: 0,
    imagenes: 0,
    'voz-de-marca': 0,
    audiencia: 0,
    'acciones-rapidas': 0,
    'flujo-semanal': 0,
  })

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id as TutorialSectionId
          ratiosRef.current[id] = entry.isIntersecting ? entry.intersectionRatio : 0
        }

        const nextActive = sections
          .map((section) => ({
            id: section.id,
            ratio: ratiosRef.current[section.id],
          }))
          .sort((left, right) => right.ratio - left.ratio)[0]

        if (nextActive && nextActive.ratio > 0) {
          setActiveSection(nextActive.id)
        }
      },
      {
        rootMargin: '-16% 0px -52% 0px',
        threshold: [0.12, 0.2, 0.35, 0.5, 0.7, 0.9],
      }
    )

    for (const section of sections) {
      const element = document.getElementById(section.id)

      if (element) {
        observer.observe(element)
      }
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  function scrollToSection(id: TutorialSectionId) {
    setActiveSection(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.history.replaceState(null, '', `#${id}`)
  }

  const activeIndex = getSectionIndex(activeSection)
  const mobileProgress = ((activeIndex + 1) / sections.length) * 100

  return (
    <div className="-mx-6 -my-6 min-h-[calc(100vh-4rem)] bg-[#0D1014] px-6 py-6 text-[15px] leading-[1.7] text-[#E0E5EB] md:-mx-10 md:-my-8 md:px-10 md:py-8">
      <div className="mx-auto flex w-full max-w-[1440px] gap-10">
        <aside className="sticky top-24 hidden h-fit w-[240px] shrink-0 md:block">
          <SectionNav
            activeSection={activeSection}
            sections={sections}
            onSelect={(id) => scrollToSection(id as TutorialSectionId)}
          />
        </aside>

        <div className="min-w-0 flex-1">
          <div className="sticky top-16 z-30 mb-6 rounded-2xl border border-[#2A3040] bg-[#0D1014]/92 px-4 py-3 backdrop-blur md:hidden">
            <div className="flex items-center justify-between gap-3 text-sm text-[#C5CBD6]">
              <span>Seccion {activeIndex + 1} de 9</span>
              <span className="truncate text-right text-[#8D95A6]">{sections[activeIndex]?.title}</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#212631]">
              <motion.div
                className="h-full rounded-full bg-[#E0E5EB]"
                animate={{ width: `${mobileProgress}%` }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              />
            </div>
          </div>

          <div className="w-full space-y-8 md:px-10">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="rounded-[28px] border border-[#2A3040] bg-[radial-gradient(circle_at_top_left,_rgba(70,45,110,0.18),_transparent_38%),linear-gradient(180deg,_rgba(255,255,255,0.02),_rgba(255,255,255,0))] p-6 md:p-10"
            >
              <div className="flex items-center gap-3 text-[#8D95A6]">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#2A3040] bg-[#12161D]">
                  <BookOpen className="h-5 w-5 text-[#E0E5EB]" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[#4E576A]">Guia interactiva</p>
                  <p className="text-sm text-[#8D95A6]">Todo lo importante en una sola pagina.</p>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <h1
                  className="text-[38px] font-medium tracking-[-0.04em] text-[#E0E5EB] md:text-[48px]"
                  style={{ fontFamily: 'var(--font-brand-display, var(--font-inter), sans-serif)' }}
                >
                  Tutorial &amp; Tips
                </h1>
                <p className="max-w-2xl text-[#A7AFBF]">
                  Aprende a configurar la herramienta, generar mejores posts y publicar con mas
                  consistencia en Instagram, X y LinkedIn sin perder la voz de Noctra.
                </p>
              </div>
            </motion.div>

            <SectionCard
              id="primeros-pasos"
              title="Primeros pasos"
              subtitle="Configura la herramienta antes de generar tu primer post."
              index={0}
            >
              <OnboardingChecklist items={checklistItems} />
            </SectionCard>

            <SectionCard
              id="generar-posts"
              title="Cómo generar posts"
              subtitle="Tres modos segun que tan claro tengas lo que quieres publicar."
              index={1}
            >
              <div className="grid gap-4 lg:grid-cols-3">
                {generateModes.map(({ howItWorks, icon: Icon, proTip, title, whenToUse }) => (
                  <div
                    key={title}
                    className="rounded-3xl border border-[#2A3040] bg-[#1A1F28] p-5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[#12161D] text-[#E0E5EB]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="text-lg font-medium text-[#E0E5EB]">{title}</h3>
                    </div>

                    <div className="mt-5 space-y-4 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-[#4E576A]">
                          Cuando usarlo
                        </p>
                        <p className="mt-2 text-[#C5CBD6]">{whenToUse}</p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-[#4E576A]">
                          Como funciona
                        </p>
                        <ol className="mt-2 space-y-2 text-[#C5CBD6]">
                          {howItWorks.map((step, index) => (
                            <li key={step} className="flex gap-3">
                              <span className="mt-0.5 text-[#4E576A]">{index + 1}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div className="rounded-2xl border border-[#2A3040] bg-[#12161D] px-4 py-3 text-[#A7AFBF]">
                        <span className="font-medium text-[#E0E5EB]">Pro tip: </span>
                        {proTip}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 rounded-3xl border border-[#2A3040] bg-[#1A1F28] p-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#4E576A]">Aprendizaje</p>
                  <h3 className="mt-2 text-xl font-medium text-[#E0E5EB]">
                    El feedback convierte generacion en criterio
                  </h3>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  {['Generas post', 'Das feedback', 'IA aprende', 'Mejores posts'].map((label, index) => (
                    <div key={label} className="flex flex-1 items-center gap-3">
                      <div className="flex-1 rounded-2xl border border-[#2A3040] bg-[#12161D] px-4 py-4 text-center text-sm text-[#E0E5EB]">
                        {label}
                      </div>
                      {index < 3 ? (
                        <ArrowRight className="hidden h-4 w-4 shrink-0 text-[#4E576A] md:block" />
                      ) : null}
                    </div>
                  ))}
                </div>

                <p className="text-[#A7AFBF]">
                  El sistema de aprendizaje se activa despues de 5 posts con feedback. A partir
                  de ahi, cada generacion usa tu historial de lo que funciono y lo que no.
                </p>
              </div>

              <div className="rounded-3xl border border-[#2A3040] bg-[#1A1F28] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[#4E576A]">
                  Tips para escribir prompts mejores
                </p>
                <h3 className="mt-2 text-xl font-medium text-[#E0E5EB]">
                  Menos vagueza, mas direccion
                </h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {promptWritingTips.map((tip) => (
                    <div
                      key={tip}
                      className="rounded-2xl border border-[#2A3040] bg-[#12161D] px-4 py-4 text-sm text-[#C5CBD6]"
                    >
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>

            <SectionCard id="instagram" title="Instagram" index={2}>
              <PlatformRulesTable brandColor="#833AB4" rows={instagramRules} />

              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#4E576A]">
                    Prompts listos para copiar
                  </p>
                  <h3 className="mt-2 text-xl font-medium text-[#E0E5EB]">
                    Instagram: contenido + visual
                  </h3>
                </div>

                <div className="grid gap-4">
                  <PromptTemplateCard
                    title="Prompt para caption o carrusel"
                    description="Usalo cuando ya tienes el tema y quieres que la IA entregue un caption fuerte con hook, CTA y hashtags."
                    prompt={instagramContentPrompt}
                  />
                  <PromptTemplateCard
                    title="Prompt para imagen de Instagram"
                    description="Usalo en Gemini o cualquier generador visual cuando quieras una imagen editorial alineada con Noctra."
                    prompt={instagramImagePrompt}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-medium text-[#E0E5EB]">Que funciona en Instagram</h3>

                <div className="space-y-3">
                  <CollapsibleTip
                    title="El hook es todo"
                    summary="Las primeras 2 lineas deciden si alguien toca 'mas'."
                  >
                    <p>
                      Instagram muestra solo las primeras ~125 caracteres del caption antes de
                      cortar con &quot;... mas&quot;. Si no enganchas ahi, perdiste al lector.
                    </p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/70">
                          Hook fuerte
                        </p>
                        <p className="mt-2 text-emerald-50">
                          &quot;El 80% de las webs en Mexico pierden clientes en los primeros 3
                          segundos. La tuya probablemente tambien.&quot;
                        </p>
                      </div>
                      <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-rose-200/70">
                          Hook debil
                        </p>
                        <p className="mt-2 text-rose-50">
                          &quot;Hoy quiero hablar sobre la importancia del diseno web para los
                          negocios.&quot;
                        </p>
                      </div>
                    </div>
                    <p className="mt-4">
                      Como generarlo aqui: usa el angulo <strong>Dato</strong> o{' '}
                      <strong>Opinion</strong>. Ambos generan hooks mas directos.
                    </p>
                  </CollapsibleTip>

                  <CollapsibleTip
                    title="Carrusel vs. publicación única"
                    summary="Cuando usar cada formato cambia retencion y profundidad."
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-[#2A3040] bg-[#12161D] p-4">
                        <p className="font-medium text-[#E0E5EB]">Usa CARRUSEL cuando:</p>
                        <ul className="mt-3 space-y-2 text-[#C5CBD6]">
                          <li>- Tienes un proceso paso a paso (Tutorial).</li>
                          <li>- Quieres hacer una lista (Top 5, Errores comunes).</li>
                          <li>- Tienes un caso de estudio con contexto.</li>
                          <li>- El tema necesita mas de 150 palabras para explicarse bien.</li>
                        </ul>
                      </div>
                      <div className="rounded-2xl border border-[#2A3040] bg-[#12161D] p-4">
                        <p className="font-medium text-[#E0E5EB]">Usa PUBLICACION UNICA cuando:</p>
                        <ul className="mt-3 space-y-2 text-[#C5CBD6]">
                          <li>- Tienes una opinion fuerte y directa.</li>
                          <li>- Compartes una foto o imagen de trabajo real.</li>
                          <li>- Anuncias algo (nuevo servicio, cliente, logro).</li>
                        </ul>
                      </div>
                    </div>
                    <p className="mt-4">
                      Los carruseles tienen mayor retencion promedio que las publicaciones unicas.
                      El primer slide es tu portada: si no genera curiosidad, nadie desliza.
                    </p>
                  </CollapsibleTip>

                  <CollapsibleTip
                    title="Fondos de carrusel"
                    summary="La app sugiere fondos dinámicos por slide al exportar."
                  >
                    <p>
                      Cuando generas un carrusel de Instagram, la app recomienda un fondo
                      específico por cada slide (Imagen, Degradado o Color sólido) para
                      maximizar el impacto visual y la legibilidad.
                    </p>
                    <ol className="mt-4 space-y-2 text-[#C5CBD6]">
                      <li>1. Revisa las recomendaciones de la IA en la previsualización.</li>
                      <li>2. Cambia el tipo de fondo o busca una imagen en Unsplash si lo prefieres.</li>
                      <li>3. Exporta el post (ZIP) para obtener las instrucciones de diseño.</li>
                      <li>4. En Canva o Figma, aplica los estilos indicados en `canva_instructions.txt`.</li>
                    </ol>
                    <p className="mt-4">
                      Alternar entre fondos oscuros y claros genera un ritmo visual que mantiene
                      al usuario deslizando hasta el final.
                    </p>
                  </CollapsibleTip>

                  <CollapsibleTip
                    title="Imagen + caption: la fórmula"
                    summary="La imagen detiene el scroll; el caption convierte."
                  >
                    <p>
                      Necesitas que imagen y texto trabajen juntos. La imagen genera curiosidad y
                      el caption responde esa curiosidad.
                    </p>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-[#2A3040] bg-[#12161D] p-4">
                        <p className="font-medium text-[#E0E5EB]">IMAGEN</p>
                        <ul className="mt-3 space-y-2 text-[#C5CBD6]">
                          <li>- Busca en /visual usando los keywords del post.</li>
                          <li>- Filtra por score on-brand (≥ 0.7 recomendado).</li>
                          <li>- Elige imagenes oscuras o de alto contraste.</li>
                          <li>- Evita stock generico: equipo sonriendo, laptop en mesa.</li>
                        </ul>
                      </div>
                      <div className="rounded-2xl border border-[#2A3040] bg-[#12161D] p-4">
                        <p className="font-medium text-[#E0E5EB]">TEXTO EN IMAGEN</p>
                        <ul className="mt-3 space-y-2 text-[#C5CBD6]">
                          <li>- Usalo solo si anade informacion nueva.</li>
                          <li>- Maximo 8 palabras.</li>
                          <li>- Deja que Gemini sugiera el placement inicial.</li>
                        </ul>
                      </div>
                    </div>
                    <p className="mt-4">
                      Formula ganadora: <strong>Imagen que genera pregunta + Caption que responde = engagement</strong>.
                    </p>
                  </CollapsibleTip>
                </div>
              </div>
            </SectionCard>

            <SectionCard id="x-twitter" title="X (Twitter)" index={3}>
              <PlatformRulesTable brandColor="#1DA1F2" rows={xRules} />

              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#4E576A]">
                    Prompts listos para copiar
                  </p>
                  <h3 className="mt-2 text-xl font-medium text-[#E0E5EB]">
                    X: hilo + imagen
                  </h3>
                </div>

                <div className="grid gap-4">
                  <PromptTemplateCard
                    title="Prompt para hilo en X"
                    description="Pensado para hilos con postura clara, ritmo corto y un Tweet 1 que realmente abra el hilo."
                    prompt={xContentPrompt}
                  />
                  <PromptTemplateCard
                    title="Prompt para visual de X"
                    description="Ideal para una imagen horizontal que complemente el hilo sin verse decorativa o genérica."
                    prompt={xImagePrompt}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <CollapsibleTip
                  title="El hook del hilo — la métrica más importante"
                  summary="En un hilo, el Tweet 1 decide si alguien abre o no."
                >
                  <p>
                    En un hilo, el Tweet 1 es el unico que la mayoria vera. Si no genera curiosidad
                    o valor inmediato, nadie abre el hilo.
                  </p>
                  <p className="mt-4">
                    La app evalua automaticamente la fuerza del hook:
                    <br />- Fuerte: publicalo tal cual.
                    <br />- Medio o Debil: usa el boton <strong>Regenerar solo el hook</strong>{' '}
                    sin reescribir todo el hilo.
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-50">
                      &quot;Las agencias digitales en Mexico cobran diseno. Deberian cobrar estrategia.
                      Hay una diferencia enorme. 🧵&quot;
                    </div>
                    <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-rose-50">
                      &quot;Quiero hablar sobre algo que he observado trabajando con clientes en
                      Queretaro.&quot;
                    </div>
                  </div>
                  <p className="mt-4">
                    Regla: el Tweet 1 debe funcionar perfectamente solo, sin necesitar el contexto
                    del hilo.
                  </p>
                </CollapsibleTip>

                <CollapsibleTip
                  title="Hilo vs. Artículo — cuándo usar cada uno"
                  summary="La decision depende de si tus ideas se separan o necesitan continuidad."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-[#2A3040] bg-[#12161D] p-4">
                      <p className="font-medium text-[#E0E5EB]">HILO cuando:</p>
                      <ul className="mt-3 space-y-2 text-[#C5CBD6]">
                        <li>- Tu argumento tiene 4-8 puntos claros y separables.</li>
                        <li>- Quieres que cada punto sea citable por separado.</li>
                        <li>- Buscas mas interaccion (RT, respuestas por tweet).</li>
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-[#2A3040] bg-[#12161D] p-4">
                      <p className="font-medium text-[#E0E5EB]">ARTICULO cuando:</p>
                      <ul className="mt-3 space-y-2 text-[#C5CBD6]">
                        <li>- El tema necesita desarrollo continuo.</li>
                        <li>- Es un analisis profundo o caso de estudio detallado.</li>
                        <li>- Quieres posicionarte como referente en un tema especifico.</li>
                      </ul>
                    </div>
                  </div>
                  <p className="mt-4">
                    Los articulos de X tienen menor alcance inicial pero mayor tiempo de vida:
                    aparecen en busquedas durante mas tiempo.
                  </p>
                </CollapsibleTip>

                <CollapsibleTip
                  title="Cómo exportar y publicar un hilo"
                  summary="Del editor a X sin perder estructura ni numeracion."
                >
                  <ol className="space-y-2 text-[#C5CBD6]">
                    <li>1. Genera el hilo en /compose → X → Hilo.</li>
                    <li>2. Revisa cada tweet en la vista previa (contador de chars).</li>
                    <li>3. Exporta como TXT. El archivo numera cada tweet.</li>
                    <li>4. En X, redacta el Tweet 1 y usa &quot;Agregar al hilo&quot; para los demas.</li>
                    <li>5. Publica todo junto o programa con Buffer, Typefully o Publer.</li>
                  </ol>
                  <p className="mt-4">
                    Tip: <Link href="https://typefully.com" className="text-[#E0E5EB] underline decoration-white/30 underline-offset-4" target="_blank" rel="noreferrer">Typefully</Link> detecta
                    los saltos del TXT automaticamente y acelera la publicacion.
                  </p>
                </CollapsibleTip>
              </div>
            </SectionCard>

            <SectionCard id="linkedin" title="LinkedIn" index={4}>
              <PlatformRulesTable brandColor="#0077B5" rows={linkedinRules} />

              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#4E576A]">
                    Prompts listos para copiar
                  </p>
                  <h3 className="mt-2 text-xl font-medium text-[#E0E5EB]">
                    LinkedIn: post, carrusel y visual
                  </h3>
                </div>

                <div className="grid gap-4">
                  <PromptTemplateCard
                    title="Prompt para post de thought leadership"
                    description="Usalo cuando quieras un post publicable con hook, desarrollo claro y una postura que construya autoridad."
                    prompt={linkedinContentPrompt}
                  />
                  <PromptTemplateCard
                    title="Prompt para carrusel PDF"
                    description="Plantilla detallada para convertir una idea en un carrusel de 8 slides con progresion editorial."
                    prompt={linkedinCarouselPrompt}
                  />
                  <PromptTemplateCard
                    title="Prompt para imagen de LinkedIn"
                    description="Para headers, portada de documento o posts con look ejecutivo-editorial."
                    prompt={linkedinImagePrompt}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <CollapsibleTip
                  title="Saltos de línea: el secreto visual de LinkedIn"
                  summary="LinkedIn respeta los saltos y eso mejora legibilidad y retencion."
                >
                  <p>
                    LinkedIn renderiza los saltos de linea exactamente como los escribes. Eso te
                    da una ventaja enorme para ordenar el ritmo del texto.
                  </p>
                  <p className="mt-4">
                    La app genera el contenido con saltos de linea correctos. Antes de exportar,
                    activa <strong>Vista previa LinkedIn</strong> para ver como se vera en el feed.
                  </p>
                  <div className="mt-4 rounded-2xl border border-[#2A3040] bg-[#12161D] p-4">
                    <p className="font-medium text-[#E0E5EB]">Estructura que funciona</p>
                    <p className="mt-3 text-[#C5CBD6]">
                      [Linea de hook]
                      <br />
                      [Contexto o problema]
                      <br />
                      [Desarrollo en 3-4 puntos]
                      <br />
                      [Cierre con insight o pregunta]
                      <br />
                      [Hashtags]
                    </p>
                  </div>
                </CollapsibleTip>

                <CollapsibleTip
                  title="El PDF carousel: el formato de mayor alcance en LinkedIn"
                  summary="Mas tiempo de permanencia suele significar mas distribucion."
                >
                  <p>
                    Los documentos PDF en LinkedIn suelen lograr mas alcance organico promedio que
                    imagenes simples y posts de solo texto.
                  </p>
                  <p className="mt-4">
                    Por que funciona: LinkedIn mide el tiempo de permanencia. Un carrusel de 8-10
                    slides hace que la gente pase mas tiempo en tu post, y eso el algoritmo lo
                    recompensa.
                  </p>
                  <ol className="mt-4 space-y-2 text-[#C5CBD6]">
                    <li>1. Crear → LinkedIn → Carrusel / Documento.</li>
                    <li>2. Define el numero de slides (recomendado: 7-10).</li>
                    <li>3. La app genera contenido y disena el PDF automaticamente.</li>
                    <li>4. Exporta el ZIP y usa `carousel.pdf`.</li>
                    <li>5. En LinkedIn: redactar → agregar documento → subir el PDF.</li>
                  </ol>
                  <p className="mt-4">
                    El primer slide es la portada: es lo que se ve en el feed y debe generar
                    curiosidad por si solo.
                  </p>
                </CollapsibleTip>

                <CollapsibleTip
                  title="Thought Leadership en LinkedIn"
                  summary="La autoridad se construye con postura clara, no con neutralidad tibia."
                >
                  <p>
                    LinkedIn premia las opiniones directas mas que el contenido informativo
                    generico. Los posts con mayor engagement suelen tener una postura clara.
                  </p>
                  <div className="mt-4 rounded-2xl border border-[#2A3040] bg-[#12161D] p-4">
                    <p className="font-medium text-[#E0E5EB]">
                      Usa la Accion Rapida &quot;Thought Leadership&quot;
                    </p>
                    <ul className="mt-3 space-y-2 text-[#C5CBD6]">
                      <li>- Escribe el tema.</li>
                      <li>- Opcionalmente, escribe tu postura real.</li>
                      <li>- Si lo dejas vacio, la IA toma una postura contracorriente basada en tu voz.</li>
                    </ul>
                  </div>
                  <p className="mt-4">
                    Lo que diferencia a Noctra en LinkedIn es hablar de problemas reales del
                    mercado mexicano y queretano, no repetir discurso generico de marketing
                    digital.
                  </p>
                </CollapsibleTip>
              </div>
            </SectionCard>

            <SectionCard
              id="imagenes"
              title="Imágenes que funcionan"
              subtitle="Como usar /visual para encontrar y generar imagenes que refuercen tu contenido y sean on-brand."
              index={5}
            >
              <div className="rounded-3xl border border-[#2A3040] bg-[#1A1F28] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[#4E576A]">
                  Tips para prompts visuales
                </p>
                <h3 className="mt-2 text-xl font-medium text-[#E0E5EB]">
                  Como pedir mejores imagenes
                </h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {visualPromptTips.map((tip) => (
                    <div
                      key={tip}
                      className="rounded-2xl border border-[#2A3040] bg-[#12161D] px-4 py-4 text-sm text-[#C5CBD6]"
                    >
                      {tip}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-[#2A3040] bg-[#1A1F28] p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#4E576A]">Modo A — Unsplash</p>
                  <h3 className="mt-2 text-xl font-medium text-[#E0E5EB]">
                    Cuando quieres una fotografia real
                  </h3>
                  <ol className="mt-4 space-y-2 text-[#C5CBD6]">
                    <li>1. Ve a /visual → Modo A (Unsplash).</li>
                    <li>2. Escribe keywords del tema del post.</li>
                    <li>3. La app busca y ordena por score on-brand (0.0 a 1.0).</li>
                    <li>4. Filtra por score ≥ 0.7.</li>
                    <li>5. Haz clic en la imagen y abre el editor de overlay.</li>
                    <li>6. Ajusta el ratio segun la plataforma.</li>
                    <li>7. Guarda en tu biblioteca o usala en el post.</li>
                  </ol>
                </div>

                <div className="rounded-3xl border border-[#2A3040] bg-[#1A1F28] p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#4E576A]">Modo B — Gemini</p>
                  <h3 className="mt-2 text-xl font-medium text-[#E0E5EB]">
                    Cuando necesitas algo mas especifico o conceptual
                  </h3>
                  <ol className="mt-4 space-y-2 text-[#C5CBD6]">
                    <li>1. Ve a /visual → Modo B (Gemini Generate).</li>
                    <li>2. Describe lo que necesitas en el prompt.</li>
                    <li>3. Activa &quot;Mejorar prompt&quot; para anteponer el estilo editorial Noctra.</li>
                    <li>4. Selecciona el estilo: Minimal / Editorial / Abstract / Photography.</li>
                    <li>5. Genera con Imagen 3 de Google.</li>
                    <li>6. Ajusta el prompt y regenera hasta dar con la direccion correcta.</li>
                  </ol>
                </div>
              </div>

              <div className="rounded-3xl border border-[#2A3040] bg-[#1A1F28] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[#4E576A]">Tip box</p>
                <p className="mt-3 text-[#E0E5EB]">
                  Keywords que funcionan para Noctra: dark background professional, minimal tech
                  editorial, night city abstract, focused workspace dark, architecture minimal
                  contrast, moon night calm.
                </p>
              </div>

              <GenericTable
                headers={['Estilo', 'Cuando usarlo', 'Keywords clave']}
                rows={styleGuideRows}
              />

              <div className="rounded-3xl border border-[#2A3040] bg-[#1A1F28] p-5">
                <h3 className="text-xl font-medium text-[#E0E5EB]">
                  Cuando agregar texto sobre la imagen
                </h3>
                <div className="mt-4 space-y-2 text-[#C5CBD6]">
                  <p>✓ Usalo cuando el texto agrega informacion que la imagen sola no comunica.</p>
                  <p>✗ No lo uses si el texto repite lo que la imagen ya dice.</p>
                  <p>✗ Evita mas de 8 palabras en el overlay.</p>
                  <p>
                    La app sugiere automaticamente donde colocar el texto y que color usar segun
                    el fondo. Toma esa sugerencia como punto de partida y ajusta si hace falta.
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              id="voz-de-marca"
              title="Voz de marca — el corazón de la herramienta"
              subtitle="Lo que configures aqui determina si el contenido suena como Noctra o como IA generica."
              index={6}
            >
              <div className="rounded-3xl border border-[#2A3040] bg-[#1A1F28] p-5">
                <p className="text-[#C5CBD6]">
                  Cada vez que generas un post, la IA recibe tu configuracion de voz de marca como
                  instruccion base. Sin esto, el contenido sera generico. Con una buena
                  configuracion, sonara consistentemente como tu.
                </p>
              </div>

              <div className="space-y-3">
                <CollapsibleTip
                  title="TONO"
                  summary="Describe en 3-5 palabras como habla Noctra."
                >
                  <p>
                    ✓ Ejemplo: &quot;Directo, claro, sin relleno. Authoritative sin arrogancia. El tono
                    de un guia experto.&quot;
                  </p>
                  <p className="mt-4">
                    ✗ Evita: &quot;Profesional y amigable&quot;. Es demasiado generico; cualquier marca podria
                    decir lo mismo.
                  </p>
                </CollapsibleTip>

                <CollapsibleTip
                  title="VALORES"
                  summary="Tags que representan lo que Noctra defiende."
                >
                  <p>
                    Noctra: claridad · integridad · disciplina · crecimiento.
                  </p>
                  <p className="mt-4">
                    La IA usa estos valores para mantener coherencia tematica entre posts generados
                    en diferentes momentos.
                  </p>
                </CollapsibleTip>

                <CollapsibleTip
                  title="PALABRAS PROHIBIDAS"
                  summary="Terminos que nunca deben aparecer en el contenido generado."
                >
                  <p>
                    Noctra tiene prohibidos: innovacion, soluciones integrales, potenciar (en
                    exceso), ecosistema digital, sinergia, transformacion digital.
                  </p>
                  <p className="mt-4">
                    ¿Por que? Porque estan sobresaturados y no dicen nada especifico. La IA los
                    evitara automaticamente.
                  </p>
                </CollapsibleTip>

                <CollapsibleTip
                  title="POSTS DE REFERENCIA"
                  summary="La calibracion mas poderosa para sonar autentico."
                >
                  <p>
                    Pega 2-5 posts reales que hayas escrito o que representen exactamente como
                    quieres sonar.
                  </p>
                  <p className="mt-4">
                    No tienen que ser perfectos. Solo tienen que ser autenticos. La IA analiza el
                    estilo, la longitud de frases, el nivel de formalidad y la estructura de tus
                    ejemplos para replicarlos.
                  </p>
                  <p className="mt-4">
                    Tip: incluye un post de cada plataforma si tienes. El tono en LinkedIn y en X
                    debe ser distinto.
                  </p>
                </CollapsibleTip>
              </div>

              <div className="rounded-3xl border border-[#2A3040] bg-[#1A1F28] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[#4E576A]">System learning</p>
                <p className="mt-3 text-[#C5CBD6]">
                  Ademas de tu configuracion manual, la IA aprende de tu feedback. Despues de 5
                  posts calificados:
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-50">
                    Rating 4-5 estrellas + &quot;Lo publique sin editar&quot; = ejemplo positivo.
                  </div>
                  <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-amber-50">
                    Rating 1-2 estrellas + &quot;Lo edite mucho&quot; = patron a evitar.
                  </div>
                </div>
                <p className="mt-4 text-[#A7AFBF]">
                  Podras ver que aprendio la IA revisando el historial en tu perfil. Proximamente.
                </p>
              </div>
            </SectionCard>

            <SectionCard
              id="audiencia"
              title="Construcción de audiencia"
              subtitle="Publicar te da presencia. Una estrategia de pilares y audiencia te da autoridad acumulada."
              index={7}
            >
              <div className="rounded-3xl border border-[#2A3040] bg-[#1A1F28] p-5">
                <p className="text-[#C5CBD6]">
                  La diferencia entre publicar y construir autoridad esta en la repeticion con
                  sentido. Si cada post nace aislado, tu marca puede verse activa pero no memorable.
                  Si varios posts responden al mismo sistema editorial, el mercado empieza a
                  asociarte con un criterio.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-[#2A3040] bg-[#1A1F28] p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#4E576A]">Pilares</p>
                  <h3 className="mt-3 text-xl font-medium text-[#E0E5EB]">
                    Una estrategia de pilares te evita sonar aleatorio
                  </h3>
                  <p className="mt-4 text-[#C5CBD6]">
                    Piensa en territorios que quieras dominar, no en temas sueltos. Para Noctra
                    podrian ser: claridad digital, decisiones de sitio web, errores comunes en
                    marketing y casos reales.
                  </p>
                </div>

                <div className="rounded-3xl border border-[#2A3040] bg-[#1A1F28] p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#4E576A]">Audiencia</p>
                  <h3 className="mt-3 text-xl font-medium text-[#E0E5EB]">
                    La misma idea no entra igual en todas las plataformas
                  </h3>
                  <p className="mt-4 text-[#C5CBD6]">
                    En LinkedIn puedes hablarle a directores con lenguaje mas estrategico. En
                    Instagram probablemente necesitas ejemplos simples para dueños de PYME sin
                    formacion tecnica. El tema puede ser el mismo; el nivel de traduccion no.
                  </p>
                </div>

                <div className="rounded-3xl border border-[#2A3040] bg-[#1A1F28] p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#4E576A]">Autoridad</p>
                  <h3 className="mt-3 text-xl font-medium text-[#E0E5EB]">
                    Construyes confianza cuando repites una tesis con matices
                  </h3>
                  <p className="mt-4 text-[#C5CBD6]">
                    Un buen calendario no solo se ve balanceado. Hace que la audiencia entienda
                    que tienes una postura propia y sabes explicarla a distintos perfiles sin perder
                    consistencia.
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-[#2A3040] bg-[#12161D] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[#4E576A]">Checklist</p>
                <h3 className="mt-3 text-xl font-medium text-[#E0E5EB]">
                  ¿Ya definiste tus 4 pilares?
                </h3>
                <div className="mt-5 space-y-3 text-[#C5CBD6]">
                  <p>✓ Cada pilar tiene nombre, descripcion y color.</p>
                  <p>✓ Tus pilares no compiten entre si; cada uno cubre un territorio distinto.</p>
                  <p>✓ Definiste audiencia, problemas y resultados deseados por plataforma.</p>
                  <p>✓ La IA ya puede sugerir automaticamente el pilar correcto antes de generar.</p>
                </div>
                <Link
                  href="/settings?section=studio&tab=strategy"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#E0E5EB] transition-colors hover:text-white"
                >
                  Configurar estrategia
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </SectionCard>

            <SectionCard
              id="acciones-rapidas"
              title="Acciones rápidas"
              subtitle="Atajos de IA para casos de uso especificos. Disponibles en la pagina Crear."
              index={8}
            >
              <div className="grid gap-4 md:grid-cols-2">
                {quickActions.map(({ generates, icon: Icon, name, tip, when }) => (
                  <div
                    key={name}
                    className="rounded-3xl border border-[#2A3040] bg-[#1A1F28] p-5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[#12161D] text-[#E0E5EB]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="text-lg font-medium text-[#E0E5EB]">{name}</h3>
                    </div>
                    <div className="mt-5 space-y-3 text-sm">
                      <p>
                        <span className="font-medium text-[#E0E5EB]">Cuando: </span>
                        <span className="text-[#C5CBD6]">{when}</span>
                      </p>
                      <p>
                        <span className="font-medium text-[#E0E5EB]">Genera: </span>
                        <span className="text-[#C5CBD6]">{generates}</span>
                      </p>
                      <p className="text-[#8D95A6]">
                        <span className="font-medium text-[#A7AFBF]">Tip: </span>
                        {tip}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              id="flujo-semanal"
              title="Flujo semanal recomendado"
              subtitle="Una rutina de 30-45 minutos semanales para mantener presencia consistente en 3 plataformas."
              index={9}
            >
              <div className="space-y-6">
                {timelineItems.map((item, index) => (
                  <div key={`${item.day}-${item.title}`} className="grid gap-4 md:grid-cols-[120px_24px_minmax(0,1fr)]">
                    <div className="pt-1">
                      <p className="text-xs uppercase tracking-[0.2em] text-[#4E576A]">{item.day}</p>
                      <p className="mt-2 text-sm text-[#8D95A6]">{item.duration}</p>
                    </div>

                    <div className="relative flex justify-center">
                      <span className="relative z-10 mt-1 h-3 w-3 rounded-full border border-[#E0E5EB] bg-[#0D1014]" />
                      {index < timelineItems.length - 1 ? (
                        <span className="absolute top-4 h-[calc(100%+1.5rem)] w-px bg-[#2A3040]" />
                      ) : null}
                    </div>

                    <div className="rounded-3xl border border-[#2A3040] bg-[#1A1F28] p-5">
                      <h3 className="text-lg font-medium text-[#E0E5EB]">{item.title}</h3>
                      <div className="mt-4 space-y-2 text-[#C5CBD6]">
                        {item.steps.map((step) => (
                          <p key={step}>→ {step}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <GenericTable
                headers={['Plataforma', 'Minimo', 'Optimo', 'Maximo util']}
                rows={volumeRows}
              />

              <p className="text-[#A7AFBF]">
                Consistencia &gt; volumen. 2 posts semanales publicados siempre &gt; 7 posts
                publicados una semana y ninguno las siguientes 3.
              </p>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  )
}
