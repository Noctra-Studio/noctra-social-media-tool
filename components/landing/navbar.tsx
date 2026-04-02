'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { landingContent, type LandingLocale } from '@/components/landing/content'
import { LocaleToggle } from '@/components/landing/locale-toggle'

type LandingNavbarProps = {
  locale: LandingLocale
}

export function LandingNavbar({ locale }: LandingNavbarProps) {
  const t = useTranslations('landing.nav')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 12)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    function closeMenu() {
      setIsMenuOpen(false)
    }

    window.addEventListener('resize', closeMenu)

    return () => {
      window.removeEventListener('resize', closeMenu)
    }
  }, [])

  const navLinks = landingContent.navbar.links

  function closeMenu() {
    setIsMenuOpen(false)
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'border-b border-white/8 bg-[#101417]/80 backdrop-blur-md'
          : 'bg-[#101417]/65'
      }`}
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="flex h-16 items-center justify-between px-6 sm:px-8 lg:px-10">
          <Link href="/" className="group flex min-w-0 items-center gap-3 md:w-[280px]">
            <Image
              src="/noctra-navbar-dark.svg"
              alt="Noctra Studio"
              width={164}
              height={28}
              priority
              className="h-auto w-[132px] shrink-0 opacity-95 transition duration-200 group-hover:opacity-100 sm:w-[150px]"
            />
            <div className="flex min-w-0 items-center gap-3">
              <span className="text-sm text-[#4E576A] transition-colors duration-200 group-hover:text-[#8D95A6]">
                |
              </span>
              <span
                className="truncate text-sm uppercase tracking-[0.28em] text-[#E0E5EB] transition-colors duration-200 group-hover:text-white"
                style={{ fontFamily: 'var(--font-brand-display)' }}
              >
                {landingContent.navbar.wordmark}
              </span>
            </div>
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-2 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="group relative px-4 py-3 text-sm text-[#8D95A6] transition-all duration-200 hover:text-white"
              >
                <span>{link.label[locale]}</span>
                <span className="absolute inset-x-4 bottom-1 h-px origin-center scale-x-0 bg-white/45 transition-transform duration-200 group-hover:scale-x-100" />
              </a>
            ))}
          </nav>

          <div className="hidden items-center justify-end gap-5 md:flex md:w-[280px]">
            <LocaleToggle />

            <Link
              href="/login"
              className="rounded-xl border border-[#4E576A] px-5 py-2 text-sm font-bold text-[#E0E5EB] transition-all hover:border-[#E0E5EB] hover:bg-white/5"
            >
              {t('login')}
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white md:hidden"
            onClick={() => setIsMenuOpen((current) => !current)}
            aria-expanded={isMenuOpen}
            aria-label={t('openMenu')}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="border-t border-white/8 bg-[#101417]/95 px-6 py-5 backdrop-blur-md md:hidden">
          <div className="mx-auto max-w-[1440px] space-y-5">
            <nav className="grid gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className="rounded-lg px-3 py-3 text-base text-[#E0E5EB] transition-colors hover:bg-white/[0.03]"
                >
                  {link.label[locale]}
                </a>
              ))}
            </nav>

            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4">
              <LocaleToggle />
            </div>

            <Link
              href="/login"
              onClick={closeMenu}
              className="inline-flex w-full items-center justify-center rounded-xl bg-[#E0E5EB] px-5 py-3 text-sm font-bold text-[#101417]"
            >
              {t('login')}
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
