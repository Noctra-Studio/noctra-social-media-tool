'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { startTransition, useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, CalendarDays, Home, Lightbulb, Menu, SquarePen, X } from 'lucide-react'
import { LocaleToggle } from '@/components/landing/locale-toggle'
import { createClient } from '@/lib/supabase/client'

type TopNavbarProps = {
  userAvatarUrl: string
  userEmail: string
  userName: string
}

function getInitials(email: string) {
  const [name] = email.split('@')
  return name.slice(0, 2).toUpperCase()
}

function isNavigationActive(pathname: string, href: string) {
  if (href === '/') {
    return pathname === href
  }

  return pathname.startsWith(href)
}

export function TopNavbar({ userAvatarUrl, userEmail, userName }: TopNavbarProps) {
  const t = useTranslations('dashboard.nav')
  const pathname = usePathname()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const initials = useMemo(() => getInitials(userEmail), [userEmail])
  const displayName = userName.trim() || userEmail.split('@')[0] || 'Usuario'
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)
  const navigation = [
    { href: '/home', icon: Home, label: t('home') },
    { href: '/compose', icon: SquarePen, label: t('compose') },
    { href: '/calendar', icon: CalendarDays, label: t('calendar') },
    { href: '/ideas', icon: Lightbulb, label: t('ideas') },
  ]
  const settingsLinks = [{ href: '/settings?section=account', label: t('settings') }]

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)

    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
    }
  }, [])

  async function handleSignOut() {
    setIsSigningOut(true)

    try {
      await supabase.auth.signOut()
      setIsProfileMenuOpen(false)
      setIsMobileMenuOpen(false)
      startTransition(() => {
        router.replace('/login')
        router.refresh()
      })
    } finally {
      setIsSigningOut(false)
    }
  }

  function closeMenus() {
    setIsProfileMenuOpen(false)
    setIsMobileMenuOpen(false)
  }

  const hasAvatar = userAvatarUrl.trim().length > 0

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex h-16 items-center justify-between px-8">
          <Link
            href="/compose"
            onClick={closeMenus}
            className="group flex min-w-0 items-center gap-3 md:w-[220px]"
          >
            <Image
              src="/brand/favicon-light.svg"
              alt="Noctra"
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 transition-transform duration-300 group-hover:scale-[1.04]"
            />
            <div className="flex min-w-0 flex-col">
              <span
                className="font-medium uppercase tracking-[0.2em] text-[#E0E5EB] transition-colors duration-200 group-hover:text-white"
                style={{ fontFamily: 'var(--font-brand-display, Satoshi, sans-serif)' }}
              >
                Social
              </span>
              <span className="max-h-0 overflow-hidden text-[11px] text-zinc-400 opacity-0 transition-all duration-300 group-hover:max-h-5 group-hover:opacity-100">
                Noctra Social
              </span>
            </div>
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-2 md:flex">
            {navigation.map(({ href, label }) => {
              const active = isNavigationActive(pathname, href)

              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsProfileMenuOpen(false)}
                  className={`group relative px-4 py-3 text-sm transition-all duration-200 ${
                    active ? 'font-semibold text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`absolute inset-x-4 bottom-1 h-px origin-center transition-transform duration-200 ${
                      active
                        ? 'scale-x-100 bg-white/65'
                        : 'scale-x-0 bg-white/45 group-hover:scale-x-100'
                    }`}
                  />
                </Link>
              )
            })}
          </nav>

          <div className="hidden items-center justify-end md:flex md:w-[220px]">
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((current) => !current)}
                className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#4E576A] bg-[#212631] text-xs font-medium text-white transition-colors hover:border-[#7A8498]"
                style={{ fontFamily: 'var(--font-brand-display, Satoshi, sans-serif)' }}
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="menu"
              >
                {hasAvatar ? (
                  <Image
                    src={userAvatarUrl}
                    alt={displayName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  initials
                )}
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-3 min-w-[220px] rounded-xl border border-[#2A3040] bg-[#212631] p-2 shadow-xl">
                  <div className="flex items-center gap-3 rounded-lg px-3 py-2">
                    <div
                      className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#4E576A] bg-[#212631] text-xs font-medium text-white"
                      style={{ fontFamily: 'var(--font-brand-display, Satoshi, sans-serif)' }}
                    >
                      {hasAvatar ? (
                        <Image
                          src={userAvatarUrl}
                          alt={displayName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-[#E0E5EB]">{displayName}</p>
                      <p className="truncate text-xs text-[#8D95A6]">{userEmail}</p>
                      <div className="mt-2">
                        <LocaleToggle compact />
                      </div>
                    </div>
                  </div>

                  <div className="my-2 h-px bg-[#2A3040]" />

                  <div className="grid gap-1">
                    {settingsLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="block rounded-lg px-4 py-2.5 text-sm font-normal text-[#E0E5EB] transition-colors hover:bg-[#101417]"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>

                  <div className="my-2 h-px bg-[#2A3040]" />

                  <Link
                    href="/tutorial"
                    onClick={closeMenus}
                    className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-normal text-[#E0E5EB] transition-colors hover:bg-[#101417]"
                  >
                    <BookOpen className="h-4 w-4 text-[#8D95A6]" />
                    <span>{t('tutorial')}</span>
                  </Link>

                  <div className="my-2 h-px bg-[#2A3040]" />

                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    disabled={isSigningOut}
                    className="w-full rounded-lg px-4 py-2.5 text-left text-sm font-normal text-[#EF4444] transition-colors hover:bg-[#101417] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSigningOut ? t('loggingOut') : t('logout')}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
              aria-label={isMobileMenuOpen ? t('closeMenu') : t('openMenu')}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div
            id="mobile-navigation"
            className="border-t border-white/10 bg-[#12161d] px-4 py-4 md:hidden"
          >
            <div className="space-y-2">
              {navigation.map(({ href, icon: Icon, label }) => {
                const active = isNavigationActive(pathname, href)

                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeMenus}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                      active ? 'bg-white text-black' : 'text-zinc-300 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                )
              })}
            </div>

            <div className="mt-4 rounded-xl border border-[#2A3040] bg-[#212631] p-2 shadow-xl">
              <div className="flex items-center gap-3 rounded-lg px-3 py-2">
                <div
                  className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-[#4E576A] bg-[#212631] text-xs font-medium text-white"
                  style={{ fontFamily: 'var(--font-brand-display, Satoshi, sans-serif)' }}
                >
                  {hasAvatar ? (
                    <Image
                      src={userAvatarUrl}
                      alt={displayName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm text-[#E0E5EB]">{displayName}</p>
                  <p className="truncate text-xs text-[#8D95A6]">{userEmail}</p>
                  <div className="mt-2">
                    <LocaleToggle compact />
                  </div>
                </div>
              </div>

              <div className="my-2 h-px bg-[#2A3040]" />

              <div className="grid gap-1">
                {settingsLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenus}
                    className="block rounded-lg px-4 py-2.5 text-sm font-normal text-[#E0E5EB] transition-colors hover:bg-[#101417]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="my-2 h-px bg-[#2A3040]" />

              <Link
                href="/tutorial"
                onClick={closeMenus}
                className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-normal text-[#E0E5EB] transition-colors hover:bg-[#101417]"
              >
                <BookOpen className="h-4 w-4 text-[#8D95A6]" />
                <span>{t('tutorial')}</span>
              </Link>

              <div className="my-2 h-px bg-[#2A3040]" />

              <button
                type="button"
                onClick={() => void handleSignOut()}
                disabled={isSigningOut}
                className="w-full rounded-lg px-4 py-2.5 text-left text-sm font-normal text-[#EF4444] transition-colors hover:bg-[#101417] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSigningOut ? t('loggingOut') : t('logout')}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
