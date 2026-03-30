'use client'

import Image from 'next/image'
import Link from 'next/link'
import { landingContent, type LandingLocale } from '@/components/landing/content'

type LinkItem = {
  href: string
  label: Record<LandingLocale, string>
}

function FooterLink({
  item,
  locale,
}: {
  item: LinkItem
  locale: LandingLocale
}) {
  const isExternal = item.href.startsWith('http')

  if (isExternal) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noreferrer"
        className="text-sm text-[#8D95A6] transition hover:text-[#E0E5EB]"
      >
        {item.label[locale]}
      </a>
    )
  }

  if (item.href.startsWith('#')) {
    return (
      <a
        href={item.href}
        className="text-sm text-[#8D95A6] transition hover:text-[#E0E5EB]"
      >
        {item.label[locale]}
      </a>
    )
  }

  return (
    <Link href={item.href} className="text-sm text-[#8D95A6] transition hover:text-[#E0E5EB]">
      {item.label[locale]}
    </Link>
  )
}

export function LandingFooter({ locale }: { locale: LandingLocale }) {
  return (
    <footer className="border-t border-white/6 px-6 py-14 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,180px))]">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/noctra-navbar-dark.svg"
                alt="Noctra Studio"
                width={164}
                height={28}
                className="h-auto w-[132px] shrink-0 opacity-95 sm:w-[150px]"
              />
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#4E576A]">|</span>
                <span
                  className="text-sm uppercase tracking-[0.28em] text-[#E0E5EB]"
                  style={{ fontFamily: 'var(--font-brand-display)' }}
                >
                  Social
                </span>
              </div>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-7 text-[#8D95A6]">
              {landingContent.footer.tagline[locale]}
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#4E576A]">
              {landingContent.footer.columns.platform[locale]}
            </p>
            <div className="mt-4 grid gap-3">
              {landingContent.footer.links.platform.map((item) => (
                <FooterLink key={item.href} item={item} locale={locale} />
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#4E576A]">
              {landingContent.footer.columns.resources[locale]}
            </p>
            <div className="mt-4 grid gap-3">
              {landingContent.footer.links.resources.map((item) => (
                <FooterLink key={item.href} item={item} locale={locale} />
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#4E576A]">
              {landingContent.footer.columns.legal[locale]}
            </p>
            <div className="mt-4 grid gap-3">
              {landingContent.footer.links.legal.map((item) => (
                <FooterLink key={item.href} item={item} locale={locale} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/6 pt-6 text-sm text-[#4E576A] sm:flex-row sm:items-center sm:justify-between">
          <p>{landingContent.footer.bottomLeft[locale]}</p>
          <p>{landingContent.footer.bottomRight[locale]}</p>
        </div>
      </div>
    </footer>
  )
}
