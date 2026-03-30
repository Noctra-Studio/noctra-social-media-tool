'use client'

type TutorialSection = {
  id: string
  title: string
}

type SectionNavProps = {
  activeSection: string
  onSelect: (id: string) => void
  sections: TutorialSection[]
}

export function SectionNav({ activeSection, onSelect, sections }: SectionNavProps) {
  return (
    <nav className="rounded-3xl border border-[#2A3040] bg-[#12161D] p-4">
      <p className="px-3 text-[11px] uppercase tracking-[0.24em] text-[#4E576A]">Secciones</p>

      <div className="mt-3 space-y-1">
        {sections.map((section, index) => {
          const active = section.id === activeSection

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSelect(section.id)}
              className={`flex w-full items-start gap-3 border-l-2 px-3 py-2 text-left transition-colors ${
                active
                  ? 'border-l-[#E0E5EB] bg-white/[0.03] text-white'
                  : 'border-l-transparent text-[#7E8797] hover:bg-white/[0.02] hover:text-[#E0E5EB]'
              }`}
            >
              <span className="mt-0.5 text-[11px] font-medium text-[#4E576A]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="text-sm leading-6">{section.title}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
