'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'

const checklistStorageKey = 'noctra_tutorial_checklist'

type ChecklistItem = {
  description: string
  href?: string
  id: string
  label: string
  linkLabel?: string
}

type OnboardingChecklistProps = {
  items: ChecklistItem[]
}

type ChecklistState = Record<string, boolean>

function getInitialState(items: ChecklistItem[]) {
  return items.reduce<ChecklistState>((state, item) => {
    state[item.id] = false
    return state
  }, {})
}

function readStoredState(items: ChecklistItem[]) {
  if (typeof window === 'undefined') {
    return getInitialState(items)
  }

  try {
    const raw = window.localStorage.getItem(checklistStorageKey)

    if (!raw) {
      return getInitialState(items)
    }

    const parsed = JSON.parse(raw) as Partial<ChecklistState>
    const nextState = getInitialState(items)

    for (const item of items) {
      nextState[item.id] = Boolean(parsed[item.id])
    }

    return nextState
  } catch {
    return getInitialState(items)
  }
}

export function OnboardingChecklist({ items }: OnboardingChecklistProps) {
  const [checkedState, setCheckedState] = useState<ChecklistState>(() => readStoredState(items))
  const completedCount = items.filter((item) => checkedState[item.id]).length
  const progress = (completedCount / items.length) * 100

  useEffect(() => {
    window.localStorage.setItem(checklistStorageKey, JSON.stringify(checkedState))
  }, [checkedState])

  function toggleItem(id: string) {
    setCheckedState((current) => ({
      ...current,
      [id]: !current[id],
    }))
  }

  return (
    <div className="rounded-3xl border border-[#2A3040] bg-[#212631] p-5 md:p-6">
      <div className="space-y-4">
        {items.map((item) => {
          const checked = checkedState[item.id]

          return (
            <label
              key={item.id}
              className="flex cursor-pointer items-start gap-4 rounded-2xl border border-white/5 bg-[#1A1F28] px-4 py-4 transition-colors hover:border-white/10"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleItem(item.id)}
                className="sr-only"
              />
              <span
                className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors ${
                  checked
                    ? 'border-[#E0E5EB] bg-[#E0E5EB] text-[#0D1014]'
                    : 'border-[#4E576A] bg-[#12161D] text-transparent'
                }`}
                aria-hidden="true"
              >
                <Check className="h-4 w-4" />
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className={`block text-base font-medium transition-colors ${
                    checked ? 'text-[#4E576A] line-through' : 'text-[#E0E5EB]'
                  }`}
                >
                  {item.label}
                </span>
                <span
                  className={`mt-1 block text-sm leading-7 ${
                    checked ? 'text-[#4E576A]' : 'text-[#A7AFBF]'
                  }`}
                >
                  {item.description}
                </span>
                {item.href && item.linkLabel ? (
                  <Link
                    href={item.href}
                    className="mt-2 inline-flex text-sm font-medium text-[#E0E5EB] transition-colors hover:text-white"
                  >
                    {item.linkLabel}
                  </Link>
                ) : null}
              </span>
            </label>
          )
        })}
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between gap-3 text-sm text-[#8D95A6]">
          <span>{completedCount} de 5 completados</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#212631] ring-1 ring-inset ring-[#2A3040]">
          <motion.div
            className="h-full rounded-full bg-[#E0E5EB]"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  )
}
