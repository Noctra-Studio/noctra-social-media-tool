interface StepCardProps {
  number: number
  title: string
  description: string
  variant?: 'numbered' | 'bullet'
}

export function StepCard({ number, title, description, variant = 'numbered' }: StepCardProps) {
  return (
    <div className="
      flex gap-3 items-start
      bg-white/[0.04] hover:bg-white/[0.06]
      border border-white/[0.07]
      rounded-lg px-4 py-3.5
      transition-colors duration-150
    ">
      <div className="
        w-[22px] h-[22px] rounded-full flex-shrink-0 mt-0.5
        flex items-center justify-center
        text-[11px] font-medium text-purple-300
        bg-[rgba(107,71,204,0.25)] border border-[rgba(107,71,204,0.5)]
      ">
        {number}
      </div>
      <div>
        <p className="text-[13px] font-medium text-white/85 mb-0.5">{title}</p>
        <p className="text-[12px] text-white/40 leading-[1.6]">{description}</p>
      </div>
    </div>
  )
}
