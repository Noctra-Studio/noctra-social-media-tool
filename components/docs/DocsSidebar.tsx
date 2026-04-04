'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import * as Icons from 'lucide-react'
import { DOC_NAV } from '@/lib/docs/content'

export function DocsSidebar() {
  const pathname = usePathname()

  // Group nav items by their group property
  const groups = DOC_NAV.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = []
    acc[item.group].push(item)
    return acc
  }, {} as Record<string, typeof DOC_NAV>)

  return (
    <div className="py-5 flex flex-col gap-1">
      <div className="px-4 pb-3 mb-2 border-b border-white/[0.07]">
        <p className="text-[10px] tracking-[0.2em] text-white/30 uppercase">
          Documentación
        </p>
      </div>

      {Object.entries(groups).map(([groupName, items]) => (
        <div key={groupName}>
          <p className="px-4 pt-2.5 pb-1 text-[10px] tracking-[0.15em] text-white/25 uppercase">
            {groupName}
          </p>
          {items.map(item => {
            const Icon = (Icons as any)[item.icon]
            const isActive = pathname === `/docs/${item.slug}` ||
              (pathname === '/docs' && item.slug === 'primeros-pasos')

            return (
              <Link
                key={item.slug}
                href={`/docs/${item.slug}`}
                className={`
                  flex items-center gap-2 px-4 py-[7px] text-[13px] transition-all
                  border-l-2 hover:bg-white/[0.04]
                  ${isActive
                    ? 'text-white bg-[rgba(70,45,110,0.25)] border-l-[#6b47cc]'
                    : 'text-white/50 hover:text-white/80 border-l-transparent'
                  }
                `}
              >
                {Icon && <Icon size={14} className="opacity-70 flex-shrink-0" />}
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[rgba(107,71,204,0.2)] text-purple-300 border border-[rgba(107,71,204,0.35)] font-medium">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      ))}
    </div>
  )
}
