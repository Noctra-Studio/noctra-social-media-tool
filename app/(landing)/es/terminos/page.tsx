import Link from 'next/link'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#101417] px-6 py-16 text-[#E0E5EB] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-[11px] uppercase tracking-[0.34em] text-[#4E576A]">
          Legal
        </p>
        <h1
          className="mt-4 text-4xl leading-[0.96]"
          style={{ fontFamily: 'var(--font-brand-display)' }}
        >
          Términos de Servicio
        </h1>
        <div className="mt-8 space-y-6 text-sm leading-7 text-[#8D95A6] sm:text-[15px]">
          <p>
            Noctra Social es una herramienta de acceso privado en fase de uso interno.
            El acceso anticipado se otorga caso por caso.
          </p>
          <p>
            El uso del producto requiere credenciales autorizadas. No se permite compartir
            acceso, automatizar abuso del sistema ni redistribuir contenido o materiales
            internos sin autorización de Noctra Studio.
          </p>
          <p>
            Para dudas legales o comerciales, escribe a{' '}
            <a className="text-[#E0E5EB]" href="mailto:hello@noctra.design">
              hello@noctra.design
            </a>
            .
          </p>
        </div>
        <Link href="/" className="mt-10 inline-flex text-sm text-[#E0E5EB]">
          Volver al inicio
        </Link>
      </div>
    </main>
  )
}
