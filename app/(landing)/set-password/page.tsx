"use client"

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SetPasswordForm } from '@/components/auth/SetPasswordForm'

export default function SetPasswordPage() {
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
                Account setup
              </p>
              <h1
                className="max-w-3xl text-5xl font-medium leading-[0.92] text-[#E0E5EB] sm:text-6xl"
                style={{ fontFamily: 'var(--font-brand-display)' }}
              >
                Protege tu acceso y define tu identidad operativa.
              </h1>
              <p className="max-w-xl text-base leading-7 text-[#A7AFBD] sm:text-lg">
                Establece una contraseña segura para tu cuenta antes de pasar a la configuración de tu marca y estrategia dentro del editor.
              </p>
            </div>
          </section>

          <section className="relative">
            <div className="absolute inset-0 -z-10 rounded-[32px] bg-[radial-gradient(circle_at_top,_rgba(224,229,235,0.08),_transparent_55%)] blur-2xl" />
            <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8">
              <div className="mb-8 space-y-3">
                <p className="text-[11px] uppercase tracking-[0.32em] text-[#4E576A]">
                  Account security
                </p>
                <div className="space-y-2">
                  <h2
                    className="text-3xl font-medium text-[#E0E5EB]"
                    style={{ fontFamily: 'var(--font-brand-display)' }}
                  >
                    Crea tu contraseña
                  </h2>
                  <p className="text-sm leading-6 text-[#8D95A6]">
                    Elige una contraseña para acceder de ahora en adelante al workspace operativo de Noctra Social.
                  </p>
                </div>
              </div>

              <SetPasswordForm />

              <div className="mt-8 border-t border-white/8 pt-4 text-[11px] leading-5 text-[#4E576A]">
                Al guardar, serás redirigido al proceso de onboarding para configurar la voz y estrategia de tu marca.
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
