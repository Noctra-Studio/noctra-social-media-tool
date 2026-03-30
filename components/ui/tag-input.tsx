'use client'

import { useRef, useState } from 'react'
import { X } from 'lucide-react'

type TagInputProps = {
  maxTags?: number
  onChange: (tags: string[]) => void
  placeholder?: string
  value: string[]
}

function normalizeTag(tag: string) {
  return tag.trim().replace(/\s+/g, ' ')
}

function dedupeTags(tags: string[]) {
  const seen = new Set<string>()
  const nextTags: string[] = []

  for (const tag of tags) {
    const normalizedTag = normalizeTag(tag)

    if (!normalizedTag) {
      continue
    }

    const fingerprint = normalizedTag.toLocaleLowerCase('es')

    if (seen.has(fingerprint)) {
      continue
    }

    seen.add(fingerprint)
    nextTags.push(normalizedTag)
  }

  return nextTags
}

function splitIncomingTags(rawValue: string) {
  return rawValue
    .split(/[,\n]/)
    .map(normalizeTag)
    .filter(Boolean)
}

export function TagInput({
  maxTags,
  onChange,
  placeholder = 'Añade una etiqueta',
  value,
}: TagInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [draft, setDraft] = useState('')
  const maxReached = typeof maxTags === 'number' && value.length >= maxTags
  const inputWidth = Math.max(draft.length + 1, Math.min(placeholder.length, 18))

  function commitTags(incomingTags: string[]) {
    const nextTags = dedupeTags([...value, ...incomingTags])
    const limitedTags =
      typeof maxTags === 'number' ? nextTags.slice(0, maxTags) : nextTags

    if (limitedTags.length !== value.length) {
      onChange(limitedTags)
    }
  }

  function removeTag(tagToRemove: string) {
    onChange(value.filter((tag) => tag !== tagToRemove))
  }

  function submitDraft() {
    if (!draft.trim() || maxReached) {
      setDraft('')
      return
    }

    commitTags(splitIncomingTags(draft))
    setDraft('')
  }

  return (
    <div className="grid gap-2">
      <div
        className="flex min-h-11 flex-wrap items-center gap-2 rounded-[8px] border border-[#4E576A] bg-transparent px-3 py-2 transition-colors focus-within:border-[#E0E5EB]"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded-[6px] border border-[#4E576A] bg-transparent px-2.5 py-1 text-[13px] font-medium text-[#E0E5EB] transition-colors hover:border-[#E0E5EB]"
          >
            {tag}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                removeTag(tag)
              }}
              className="ml-1.5 text-[#4E576A] transition-colors hover:text-[#E0E5EB]"
              aria-label={`Eliminar ${tag}`}
            >
              <X className="h-[14px] w-[14px]" />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={draft}
          disabled={maxReached}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={submitDraft}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault()
              submitDraft()
              return
            }

            if (event.key === 'Backspace' && !draft && value.length > 0) {
              event.preventDefault()
              onChange(value.slice(0, -1))
            }
          }}
          onPaste={(event) => {
            const pastedText = event.clipboardData.getData('text')

            if (!/[,\n]/.test(pastedText)) {
              return
            }

            event.preventDefault()

            if (!maxReached) {
              commitTags(splitIncomingTags(pastedText))
            }

            setDraft('')
          }}
          placeholder={maxReached ? '' : placeholder}
          className="min-w-[120px] flex-1 border-0 bg-transparent text-sm text-[#E0E5EB] outline-none placeholder:text-[#4E576A] disabled:cursor-not-allowed"
          style={{ width: `${inputWidth}ch` }}
        />
      </div>

      {maxReached ? (
        <p className="text-xs text-zinc-500">Máximo {maxTags} etiquetas</p>
      ) : null}
    </div>
  )
}
