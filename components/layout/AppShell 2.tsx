'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import {
  CalendarDays,
  Home,
  Lightbulb,
  Settings,
  SquarePen,
} from 'lucide-react'
import { NoctraLogoMark } from '@/components/NoctraLogoMark'

const navigation = [
  { href: '/', icon: Home, label: 'Inicio' },
  { href: '/compose', icon: SquarePen, label: 'Crear' },
  { href: '/calendar', icon: CalendarDays, label: 'Calendario' },
  { href: '/ideas', icon: Lightbulb, label: 'Ideas' },
]

type AppShellProps = {
  children: React.ReactNode
  userEmail: string
}

function getInitials(email: string) {
  const [name] = email.split('@')
  return name.slice(0, 2).toUpperCase()
}

export function AppShell({ children, userEmail }: AppShellProps) {
  const pathname = usePathname()
  const isWideCanvas = pathname === '/calendar' || pathname.startsWith('/calendar/')
  const initials = useMemo(() => getInitials(userEmail), [userEmail])

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      {/* Top Navbar (Desktop only) */}
      <header className="hidden md:flex h-16 items-center justify-between px-6 bg-zinc-900 border-b border-zinc-800 shrink-0">
        {/* Left: Logo & Text */}
        <div className="flex items-center gap-3 w-[200px]">
          <NoctraLogoMark className="h-8 w-8 shrink-0" />
          <span 
            className="font-medium tracking-[0.2em] uppercase text-[#E0E5EB]" 
            style={{ fontFamily: 'var(--font-brand-display, Satoshi, sans-serif)' }}
          >
            Social
          </span>
        </div>

        {/* Center: Navigation */}
        <nav className="flex items-center justify-center gap-2 flex-1">
          {navigation.map(({ href, label }) => {
            const active =
              href === '/'
                ? pathname === href
                : pathname === href || pathname.startsWith(`${href}/`)

            return (
              <Link
                key={href}
                href={href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'text-white bg-white/5'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Right: Avatar & Settings */}
        <div className="flex items-center justify-end gap-5 w-[200px]">
          <Link 
            href="/settings" 
            className={`transition-colors ${pathname.startsWith('/settings') ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            <Settings className="h-5 w-5" />
          </Link>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-white border border-zinc-700">
            {initials}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className={`flex-1 w-full mx-auto px-4 py-6 md:px-8 md:py-8 pb-24 md:pb-8 ${isWideCanvas ? 'max-w-none' : 'max-w-[900px]'}`}>
          {children}
        </div>
      </main>

      {/* Bottom Navigation (Mobile only) */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-zinc-900 border-t border-zinc-800 px-2 pb-safe">
        <div className="flex items-center justify-around h-16">
          {navigation.map(({ href, icon: Icon, label }) => {
            const active =
              href === '/'
                ? pathname === href
                : pathname === href || pathname.startsWith(`${href}/`)

            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  active ? 'text-white' : 'text-zinc-400'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'opacity-100' : 'opacity-80'}`} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
