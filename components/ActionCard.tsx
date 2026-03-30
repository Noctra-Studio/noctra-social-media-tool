import { ArrowRight, Box } from 'lucide-react'
import type { ElementType } from 'react'

type ActionCardProps = {
  title: string
  description: string
  ctaText?: string
  icon?: ElementType
  onClick?: () => void
}

export function ActionCard({
  title,
  description,
  ctaText = 'Abrir',
  icon: Icon = Box,
  onClick,
}: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        group flex w-full flex-col items-start text-left
        rounded-2xl border border-zinc-800 bg-zinc-900 p-5
        transition-all duration-200 hover:-translate-y-1 hover:border-zinc-700
      `}
    >
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800/50">
        <Icon className="h-5 w-5 text-zinc-400" />
      </div>

      <h3 className="text-lg font-medium text-white">{title}</h3>
      <p className="mt-2 text-sm text-zinc-400 line-clamp-2">{description}</p>

      <div className="mt-4 flex items-center gap-1 text-sm font-medium text-zinc-300 transition-colors group-hover:text-white">
        {ctaText}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  )
}
