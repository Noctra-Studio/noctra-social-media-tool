'use client'

import { useState } from 'react'

const TABS = [
  'Perfil y Cuenta',
  'Voz de marca',
  'Nivel de asistencia',
  'Plataformas conectadas',
]

export function StudioSettingsView() {
  const [activeTab, setActiveTab] = useState('Voz de marca')

  return (
    <div className="mx-auto w-full max-w-5xl md:flex md:gap-8 text-white">
      {/* Columna Izquierda (Navegación secundaria) */}
      <aside className="mb-8 md:mb-0 md:w-1/4 shrink-0">
        <nav className="flex flex-col gap-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                }`}
              >
                {tab}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Columna Derecha (Contenido) */}
      <main className="md:w-3/4 flex-1">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="mb-6">
            <h2 className="text-xl font-medium text-white mb-2">{activeTab}</h2>
            <p className="text-sm text-zinc-400">
              Personaliza cómo se comporta y se comunica Noctra.
            </p>
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            {/* Ejemplo de Inputs basados en 'Voz de Marca' */}
            {activeTab === 'Voz de marca' ? (
              <>
                <div className="flex flex-col gap-2">
                  <label htmlFor="tone" className="text-sm font-medium text-zinc-300">
                    Tono de comunicación
                  </label>
                  <input
                    id="tone"
                    type="text"
                    placeholder="Ej. Directo, profesional, minimalista..."
                    className="bg-zinc-950 border border-zinc-800 rounded-lg text-white p-3 focus:outline-none focus:border-zinc-600 transition-colors w-full"
                  />
                  <p className="text-xs text-zinc-500">
                    Describe la personalidad principal que adoptaremos en los copies.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="values" className="text-sm font-medium text-zinc-300">
                    Valores
                  </label>
                  <input
                    id="values"
                    type="text"
                    placeholder="Sobriedad, impacto, transparencia"
                    className="bg-zinc-950 border border-zinc-800 rounded-lg text-white p-3 focus:outline-none focus:border-zinc-600 transition-colors w-full"
                  />
                  <p className="text-xs text-zinc-500">
                    Palabras clave que moldean el enfoque estratégico.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="forbidden" className="text-sm font-medium text-zinc-300">
                    Palabras prohibidas
                  </label>
                  <textarea
                    id="forbidden"
                    rows={3}
                    placeholder="Ej. 'Revolucionario', 'Disruptivo', emojis excesivos..."
                    className="bg-zinc-950 border border-zinc-800 rounded-lg text-white p-3 focus:outline-none focus:border-zinc-600 transition-colors w-full resize-none"
                  />
                  <p className="text-xs text-zinc-500">
                    Términos y clichés que la IA nunca deberá generar.
                  </p>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                <p className="text-sm">Contenido de la sección de {activeTab}</p>
              </div>
            )}

            {/* Acción Principal */}
            <div className="mt-8 flex justify-end border-t border-zinc-800/50 pt-6">
              <button
                type="submit"
                className="bg-white text-black font-medium px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors"
              >
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
