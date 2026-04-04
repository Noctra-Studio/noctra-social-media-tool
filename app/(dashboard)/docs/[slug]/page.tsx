import { notFound } from 'next/navigation'
import { DOC_PAGES_ES, DOC_NAV } from '@/lib/docs/content'
import { StepCard } from '@/components/docs/StepCard'
import { Callout } from '@/components/docs/Callout'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return DOC_NAV.map(item => ({ slug: item.slug }))
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const page = DOC_PAGES_ES[slug]
  return {
    title: page ? `${page.title} — Noctra Social Docs` : 'Documentación',
    description: page?.subtitle,
    robots: {
      index: false,
      follow: false,
    }
  }
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params
  const page = DOC_PAGES_ES[slug]
  if (!page) notFound()

  const navItem = DOC_NAV.find(n => n.slug === slug)

  return (
    <div className="px-8 py-7 max-w-[760px]">
      {/* Header */}
      <div className="mb-6 pb-5 border-b border-white/[0.07]">
        <p className="text-[11px] text-white/30 mb-2.5 tracking-[0.05em]">
          Documentación <span className="text-white/50">/ {page.title}</span>
        </p>
        <h1 className="text-[22px] font-medium text-white mb-1.5 tracking-[-0.3px]">
          {page.title}
        </h1>
        <p className="text-[13px] text-white/40 leading-relaxed">
          {page.subtitle}
        </p>
      </div>

      {/* Callout */}
      {page.callout && <Callout {...page.callout} className="mb-6" />}

      {/* Sections */}
      {page.sections.map((section, si) => (
        <div key={si} className="mb-7">
          <p className="text-[10px] tracking-[0.1em] text-white/40 uppercase mb-3 font-medium">
            {section.title}
          </p>
          <div className="flex flex-col gap-2">
            {section.steps.map((step, i) => (
              <StepCard
                key={i}
                number={i + 1}
                title={step.title}
                description={step.description}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
