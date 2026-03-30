"use client";

import Image from 'next/image';
import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getSupabasePublicConfig } from '@/lib/supabase/config';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const supabaseConfig = getSupabasePublicConfig();
  const isSupabaseReady = supabaseConfig.isConfigured;
  const isBusy = loading || isPending;

  const submitLoginForm = () => {
    if (!isBusy) {
      formRef.current?.requestSubmit();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isSupabaseReady) {
      setErrorMsg(`${supabaseConfig.message} Ahora mismo el proyecto solo tiene .env.example.`)
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      startTransition(() => {
        router.push('/');
        router.refresh();
      });
    } catch (error) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'No fue posible iniciar sesión. Revisa la configuración de Supabase e inténtalo de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 relative min-h-screen overflow-hidden bg-[#101417] text-[#E0E5EB] duration-300">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(224,229,235,0.08),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(70,45,110,0.2),_transparent_32%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(224,229,235,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(224,229,235,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between gap-4">
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#4E576A]">
            Noctra Social OS
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-[#E0E5EB]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#462D6E]" />
            White-label ready
          </div>
        </header>

        <main className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[minmax(0,1.1fr)_420px] lg:gap-16">
          <section className="max-w-2xl space-y-8">
            <Image
              src="/noctra-navbar-dark.svg"
              alt="Noctra Studio"
              width={230}
              height={60}
              priority
              className="h-auto w-[190px] sm:w-[230px]"
            />

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
                    Accede a tu estudio
                  </h2>
                  <p className="text-sm leading-6 text-[#8D95A6]">
                    Entra con tus credenciales internas para abrir el workspace
                    operativo de Noctra.
                  </p>
                </div>
              </div>

              {!isSupabaseReady && (
                <div className="mb-5 rounded-2xl border border-[#4E576A] bg-[#212631]/70 px-4 py-3 text-sm leading-6 text-[#E0E5EB]">
                  <p className="font-medium">Supabase aún no está configurado.</p>
                  <p className="mt-1 text-[#A7AFBD]">{supabaseConfig.message}</p>
                </div>
              )}

              <form ref={formRef} onSubmit={handleLogin} className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-xs uppercase tracking-[0.22em] text-[#4E576A]">
                    Correo
                  </span>
                  <input
                    type="email"
                    placeholder="tu@noctra.studio"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isBusy}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        submitLoginForm();
                      }
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-[#101417]/80 px-4 py-3.5 text-base text-[#E0E5EB] placeholder:text-[#4E576A] transition-colors focus:border-[#E0E5EB]/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-xs uppercase tracking-[0.22em] text-[#4E576A]">
                    Contraseña
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isBusy}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        submitLoginForm();
                      }
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-[#101417]/80 px-4 py-3.5 text-base text-[#E0E5EB] placeholder:text-[#4E576A] transition-colors focus:border-[#E0E5EB]/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </label>

                {errorMsg && (
                  <div
                    role="alert"
                    className="rounded-2xl border border-[#462D6E]/60 bg-[#462D6E]/12 px-4 py-3 text-sm leading-6 text-[#E0E5EB]"
                  >
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isBusy}
                  className="flex w-full items-center justify-center rounded-2xl bg-[#E0E5EB] px-4 py-3.5 text-sm font-medium tracking-[0.14em] text-[#101417] uppercase transition duration-200 hover:bg-white disabled:cursor-not-allowed disabled:bg-[#E0E5EB]/50"
                  style={{ fontFamily: 'var(--font-brand-display)' }}
                >
                  {isBusy ? <Loader2 className="animate-spin" size={18} /> : 'Iniciar sesión'}
                </button>
              </form>

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
  );
}
