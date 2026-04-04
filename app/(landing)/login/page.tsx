"use client"

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { AccessRequestForm } from '@/components/auth/AccessRequestForm'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'request'>('login')

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 relative min-h-screen overflow-hidden bg-[#101417] text-[#E0E5EB] duration-300">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(224,229,235,0.08),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(70,45,110,0.2),_transparent_32%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(224,229,235,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(224,229,235,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-start">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-[#E0E5EB] transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Volver a la landing</span>
            </Link>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-[#E0E5EB]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#A7AFBD]" />
            White-label ready
          </div>
        </header>

        <main className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,520px)] lg:gap-16">
          <section className="hidden max-w-2xl space-y-8 lg:block">
            <div className="flex items-center gap-3">
              <Image
                src="/noctra-navbar-dark.svg"
                alt="Noctra Studio"
                width={230}
                height={60}
                priority
                className="h-auto w-[190px] sm:w-[230px]"
              />
              <div className="flex items-center gap-3">
                <span className="text-xl text-[#4E576A]">|</span>
                <span
                  className="text-xl uppercase tracking-[0.28em] text-[#E0E5EB]"
                  style={{ fontFamily: 'var(--font-brand-display)' }}
                >
                  Social
                </span>
              </div>
            </div>

            <div className="space-y-5">
              <p className="text-[11px] uppercase tracking-[0.36em] text-[#4E576A]">
                Clarity in digital chaos
              </p>
              <h1
                className="max-w-3xl text-5xl font-medium leading-[0.92] text-[#E0E5EB] sm:text-6xl"
                style={{ fontFamily: 'var(--font-brand-display)' }}
              >
                Una entrada sobria para operar redes con foco, criterio y calma.
              </h1>
              <p className="max-w-xl text-base leading-7 text-[#A7AFBD] sm:text-lg">
                Diseñada para Noctra Studio hoy, pensada para escalar mañana como una
                experiencia personalizable por cliente sin perder claridad ni control.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['Minimalist', 'Interfaz limpia, sin ruido visual.'],
                ['Trustworthy', 'Acceso privado y lenguaje sobrio.'],
                ['Visionary', 'Base lista para crecer a white-label.'],
              ].map(([title, description]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-sm"
                >
                  <p
                    className="text-sm font-medium text-[#E0E5EB]"
                    style={{ fontFamily: 'var(--font-brand-display)' }}
                  >
                    {title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#8D95A6]">{description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="relative">
            <div className="absolute inset-0 -z-10 rounded-[32px] bg-[radial-gradient(circle_at_top,_rgba(224,229,235,0.08),_transparent_55%)] blur-2xl" />
            <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8">
              <div className="mb-8 space-y-3">
                <p className="text-[11px] uppercase tracking-[0.32em] text-[#4E576A]">
                  Private access
                </p>
                <div className="space-y-2">
                  <h2
                    className="text-3xl font-medium text-[#E0E5EB]"
                    style={{ fontFamily: 'var(--font-brand-display)' }}
                  >
                    {tab === 'login' ? 'Bienvenido de vuelta' : 'Solicitar acceso'}
                  </h2>
                  <p className="text-sm leading-6 text-[#8D95A6]">
                    {tab === 'login'
                      ? 'Entra con tus credenciales internas para abrir el workspace operativo de Noctra.'
                      : 'Comparte tu contexto y revisaremos manualmente si Noctra Social es la siguiente capa correcta para tu equipo.'}
                  </p>
                </div>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-[#0d1116]/70 p-1">
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className={`min-h-[44px] rounded-[14px] px-4 py-2.5 text-sm transition ${
                    tab === 'login'
                      ? 'bg-white/10 text-white'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  Iniciar sesión
                </button>
                <button
                  type="button"
                  onClick={() => setTab('request')}
                  className={`min-h-[44px] rounded-[14px] px-4 py-2.5 text-sm transition ${
                    tab === 'request'
                      ? 'bg-white/10 text-white'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  Solicitar acceso
                </button>
              </div>

              {tab === 'login' ? <LoginForm /> : <AccessRequestForm />}

              <div className="mt-6 border-t border-white/8 pt-4 text-[11px] leading-5 text-[#4E576A]">
                Brand mode: Noctra Core. La arquitectura visual y de acceso queda lista
                para evolucionar a workspaces por cliente con identidad propia.
              </div>
            </div>
          </section>
        </main>

        <footer className="flex flex-col gap-2 text-[10px] uppercase tracking-[0.28em] text-[#4E576A] sm:flex-row sm:items-center sm:justify-between">
          <span>Calm. Reliable. Visionary.</span>
          <span>Querétaro, México</span>
        </footer>
      </div>
    </div>
  )
}
