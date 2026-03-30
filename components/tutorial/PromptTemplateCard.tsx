'use client'

import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'

type PromptTemplateCardProps = {
  description: string
  prompt: string
  title: string
}

export function PromptTemplateCard({
  description,
  prompt,
  title,
}: PromptTemplateCardProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setCopied(false)
    }, 1800)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [copied])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="rounded-3xl border border-[#2A3040] bg-[#1A1F28] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-lg font-medium text-[#E0E5EB]">{title}</h4>
          <p className="mt-2 text-sm leading-6 text-[#A7AFBF]">{description}</p>
        </div>

        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#2A3040] bg-[#12161D] px-3 py-2 text-xs font-medium text-[#E0E5EB] transition-colors hover:border-white/15 hover:bg-white/[0.03]"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>

      <pre className="mt-4 overflow-x-auto rounded-2xl border border-[#2A3040] bg-[#0F1319] p-4 text-sm leading-7 whitespace-pre-wrap text-[#DCE2EA]">
        {prompt}
      </pre>
    </div>
  )
}
