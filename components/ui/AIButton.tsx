'use client'

import type { ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { AlertCircle, Check, Loader2, Sparkles } from 'lucide-react'

export type AIButtonState = 'idle' | 'loading' | 'success' | 'error'

type AIButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  errorLabel?: string
  icon?: LucideIcon
  idleLabel: string
  loadingLabel?: string
  state?: AIButtonState
  successLabel?: string
  variant?: 'primary' | 'secondary'
}

function getVariantClasses(variant: NonNullable<AIButtonProps['variant']>, state: AIButtonState) {
  if (variant === 'secondary') {
    if (state === 'success') {
      return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100'
    }

    if (state === 'error') {
      return 'border-rose-400/30 bg-rose-400/10 text-rose-100'
    }

    return 'border-white/10 bg-transparent text-[#E0E5EB] hover:border-white/20 hover:bg-white/5'
  }

  if (state === 'success') {
    return 'bg-emerald-300 text-[#101417] hover:bg-emerald-200'
  }

  if (state === 'error') {
    return 'bg-rose-300 text-[#101417] hover:bg-rose-200'
  }

  return 'bg-[#E0E5EB] text-[#101417] hover:bg-white'
}

export function AIButton({
  className = '',
  disabled,
  errorLabel,
  icon: Icon = Sparkles,
  idleLabel,
  loadingLabel,
  state = 'idle',
  successLabel,
  type = 'button',
  variant = 'primary',
  ...props
}: AIButtonProps) {
  const isDisabled = disabled || state === 'loading'
  const stateLabel =
    state === 'loading'
      ? loadingLabel || idleLabel
      : state === 'success'
        ? successLabel || idleLabel
        : state === 'error'
          ? errorLabel || idleLabel
          : idleLabel

  const StateIcon =
    state === 'loading' ? Loader2 : state === 'success' ? Check : state === 'error' ? AlertCircle : Icon

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none ${className} ${getVariantClasses(
        variant,
        state
      )}`.trim()}
      style={{ fontFamily: 'var(--font-brand-display)' }}
      {...props}
    >
      <StateIcon className={`h-4 w-4 ${state === 'loading' ? 'animate-spin' : ''}`} />
      <span>{stateLabel}</span>
    </button>
  )
}
