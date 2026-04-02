"use client"

import { useState } from "react"
import { X, Sparkles, Hash, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface TagsEditorProps {
  tags: string[]
  onChange: (tags: string[]) => void
  onSuggest?: () => void
  isSuggesting?: boolean
}

export function TagsEditor({ tags, onChange, onSuggest, isSuggesting }: TagsEditorProps) {
  const [inputValue, setInputValue] = useState("")

  const addTag = (tag: string) => {
    const cleaned = tag.trim().replace(/^#+/, "")
    const freshTag = cleaned ? `#${cleaned}` : ""
    if (freshTag && !tags.includes(freshTag)) {
      onChange([...tags, freshTag])
    }
    setInputValue("")
  }

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-[#E0E5EB]">
          <Hash className="w-4 h-4 text-[#462D6E]" />
          <span>Hashtags Estratégicos</span>
        </div>
        {onSuggest && (
          <button
            onClick={onSuggest}
            disabled={isSuggesting}
            className="flex items-center h-7 px-2 text-[10px] uppercase font-bold tracking-wider text-[#94A3B8] hover:text-[#E0E5EB] hover:bg-white/5 rounded-md transition-all gap-1.5 disabled:opacity-50"
          >
            {isSuggesting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3 text-[#462D6E]" />
            )}
            Sugerir IA
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 p-3 bg-[#101417]/50 border border-white/5 rounded-xl min-h-[100px] align-content-start focus-within:border-white/10 transition-colors">
        {tags.map((tag) => (
          <div
            key={tag}
            className="inline-flex items-center bg-[#212631] text-[#E0E5EB] border border-white/5 rounded-md py-1 pl-2 pr-1 gap-1 group transition-colors hover:border-white/10"
          >
            <span className="text-[13px] font-medium">{tag}</span>
            <button
              onClick={() => removeTag(tag)}
              className="p-0.5 rounded-sm hover:bg-white/10 text-[#4E576A] hover:text-white transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => inputValue && addTag(inputValue)}
          placeholder={tags.length === 0 ? "Añadir tags (tech, marketing...)" : "Añadir..."}
          className="flex-1 bg-transparent border-none outline-none text-sm text-[#E0E5EB] placeholder:text-[#4E576A] min-w-[120px] h-7"
        />
      </div>
      
      <p className="text-[10px] text-[#4E576A] italic ml-1">
        Tip: Presiona Enter o Coma para añadir. La IA sugiere tags basados en tu tema.
      </p>
    </div>
  )
}
