'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight } from 'lucide-react'

type EmptyStateAction = {
  href?: string
  label: string
  onClick?: () => void
}

type EmptyStateProps = {
  action: EmptyStateAction
  description: string
  icon: LucideIcon
  title: string
}

const actionClassName =
  'mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-[#E0E5EB] transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none'

export function EmptyState({ action, description, icon: Icon, title }: EmptyStateProps) {
  return (
    <div className="rounded-[28px] border border-dashed border-white/10 bg-[#101417] px-6 py-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
        <Icon className="h-6 w-6 text-[#E0E5EB]" strokeWidth={1.8} />
      </div>
      <h3
        className="mt-5 text-xl font-medium text-[#E0E5EB]"
        style={{ fontFamily: 'var(--font-brand-display)' }}
      >
        {title}
      </h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#8D95A6]">{description}</p>

      {action.href ? (
        <Link href={action.href} className={actionClassName}>
          {action.label}
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : (
        <button type="button" onClick={action.onClick} className={actionClassName}>
          {action.label}
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
