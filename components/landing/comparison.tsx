'use client'

import {
  getComparisonValueLabel,
  landingContent,
  type LandingLocale,
} from '@/components/landing/content'
import { SectionLabel, SectionReveal } from '@/components/landing/section-reveal'

function getValueTone(value: ReturnType<typeof getComparisonValueLabel>) {
  if (value === '✓') {
    return 'text-[#4ADE80]'
  }

  if (
    value === 'Partial' ||
    value === 'Parcial' ||
    value === 'Manual' ||
    value === 'Separado' ||
    value === 'Separate tool'
  ) {
    return 'text-[#FCD34D]'
  }

  return 'text-[#4E576A]'
}

export function Comparison({ locale }: { locale: LandingLocale }) {
  return (
    <SectionReveal id="comparativa" className="border-t border-white/6 px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <SectionLabel>{landingContent.comparison.label[locale]}</SectionLabel>
          <h2
            className="mt-4 text-4xl leading-[0.96] text-[#E0E5EB] sm:text-5xl"
            style={{ fontFamily: 'var(--font-brand-display)' }}
          >
            {landingContent.comparison.heading[locale]}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#8D95A6]">
            {landingContent.comparison.subheading[locale]}
          </p>
        </div>

        <div className="mt-12 overflow-x-auto rounded-[28px] border border-white/8 bg-white/[0.03]">
          <table className="min-w-[720px] w-full border-collapse">
            <thead>
              <tr className="border-b border-white/8 text-left text-sm text-[#8D95A6]">
                <th className="px-5 py-4 font-normal sm:px-6"></th>
                <th className="px-5 py-4 font-normal sm:px-6">
                  {landingContent.comparison.columns.generic[locale]}
                </th>
                <th className="px-5 py-4 font-normal sm:px-6">
                  {landingContent.comparison.columns.chatgpt[locale]}
                </th>
                <th className="px-5 py-4 font-normal sm:px-6">
                  <div className="rounded-2xl border border-[#E0E5EB] bg-white/[0.03] px-4 py-3 text-[#E0E5EB]">
                    {landingContent.comparison.columns.noctra}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {landingContent.comparison.rows.map((row) => (
                <tr key={row.label.es} className="border-b border-white/6 last:border-0">
                  <td className="px-5 py-4 text-sm text-[#E0E5EB] sm:px-6">
                    {row.label[locale]}
                  </td>
                  {(['generic', 'chatgpt', 'noctra'] as const).map((column) => {
                    const label = getComparisonValueLabel(locale, row.values[column])
                    const isNoctra = column === 'noctra'

                    return (
                      <td
                        key={column}
                        className={`px-5 py-4 text-sm sm:px-6 ${
                          isNoctra ? 'bg-white/[0.02]' : ''
                        }`}
                      >
                        <span className={getValueTone(label)}>{label}</span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SectionReveal>
  )
}
