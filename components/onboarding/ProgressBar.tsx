'use client'

import { Check } from 'lucide-react'
import { onboardingStepLabels } from '@/lib/onboarding'

type ProgressBarProps = {
  currentStep: number
}

export function ProgressBar({ currentStep }: ProgressBarProps) {
  const total = onboardingStepLabels.length
  const visualStep = Math.min(currentStep, total)
  const progressPct = ((visualStep - 1) / total) * 100

  return (
    <div className="space-y-5">
      {/* Top row: logo area + step count */}
      <div className="flex items-center justify-between">
        <p
          className="text-[13px] font-medium uppercase tracking-[0.22em] text-white/25"
          style={{ fontFamily: 'var(--font-brand-display)' }}
        >
          Noctra Social
        </p>
        <p className="text-[12px] text-white/35">
          {visualStep} / {total}
        </p>
      </div>

      {/* Step labels */}
      <div className="grid grid-cols-6 gap-1">
        {onboardingStepLabels.map((label, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === visualStep

          return (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-medium transition-all duration-300 ${
                  isCompleted
                    ? 'border-[#6B47CC] bg-[#6B47CC] text-white'
                    : isCurrent
                      ? 'border-[#6B47CC] bg-[#6B47CC]/15 text-white'
                      : 'border-white/12 bg-transparent text-white/25'
                }`}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : stepNumber}
              </div>
              <span
                className={`hidden text-center text-[10px] leading-tight transition-colors sm:block ${
                  isCurrent ? 'text-white/70' : isCompleted ? 'text-white/40' : 'text-white/20'
                }`}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Progress track */}
      <div className="relative h-px w-full overflow-visible bg-white/[0.07]">
        <div
          className="absolute left-0 top-0 h-full bg-[#6B47CC] transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  )
}
