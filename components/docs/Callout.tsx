interface CalloutProps {
  type: 'info' | 'warning' | 'tip'
  content: string
  className?: string
}

const styles = {
  info: {
    bg: 'bg-[rgba(70,45,110,0.15)]',
    border: 'border-[rgba(107,71,204,0.3)]',
    icon: '◈',
    iconColor: 'text-purple-300'
  },
  warning: {
    bg: 'bg-[rgba(180,100,0,0.12)]',
    border: 'border-[rgba(200,130,30,0.3)]',
    icon: '⚠',
    iconColor: 'text-amber-400'
  },
  tip: {
    bg: 'bg-[rgba(15,110,86,0.12)]',
    border: 'border-[rgba(29,158,117,0.3)]',
    icon: '✦',
    iconColor: 'text-emerald-400'
  }
}

export function Callout({ type, content, className = '' }: CalloutProps) {
  const s = styles[type]
  return (
    <div className={`
      ${s.bg} ${s.border} border rounded-lg
      px-4 py-3 flex gap-3 items-start
      ${className}
    `}>
      <span className={`${s.iconColor} text-[14px] flex-shrink-0 mt-0.5`}>{s.icon}</span>
      <p
        className="text-[12px] text-white/55 leading-[1.6]"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  )
}
