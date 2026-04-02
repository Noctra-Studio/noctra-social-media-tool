'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subDays,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type DateRangeValue = {
  from: string | null
  to: string | null
}

type DateRangePickerProps = {
  onChange: (value: DateRangeValue) => void
  value: DateRangeValue
}

const weekdayLabels = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']

function parseDateValue(value: string | null) {
  return value ? new Date(`${value}T00:00:00`) : null
}

function formatDateValue(date: Date | null) {
  return date ? format(date, 'yyyy-MM-dd') : null
}

export function DateRangePicker({ onChange, value }: DateRangePickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState(() => parseDateValue(value.from) ?? new Date())

  const fromDate = useMemo(() => parseDateValue(value.from), [value.from])
  const toDate = useMemo(() => parseDateValue(value.to), [value.to])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(visibleMonth)
    const monthEnd = endOfMonth(visibleMonth)
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

    return eachDayOfInterval({ end: gridEnd, start: gridStart })
  }, [visibleMonth])

  const label = value.from && value.to
    ? `${format(parseDateValue(value.from)!, 'd MMM', { locale: es })} - ${format(
        parseDateValue(value.to)!,
        'd MMM',
        { locale: es }
      )}`
    : value.from
      ? `Desde ${format(parseDateValue(value.from)!, 'd MMM', { locale: es })}`
      : 'Rango de fecha'

  const setPreset = (days: number) => {
    const today = new Date()
    onChange({
      from: formatDateValue(subDays(today, days - 1)),
      to: formatDateValue(today),
    })
    setVisibleMonth(today)
  }

  const handleDaySelect = (day: Date) => {
    if (!fromDate || (fromDate && toDate)) {
      onChange({
        from: formatDateValue(day),
        to: null,
      })
      return
    }

    if (isBefore(day, fromDate)) {
      onChange({
        from: formatDateValue(day),
        to: formatDateValue(fromDate),
      })
      return
    }

    onChange({
      from: formatDateValue(fromDate),
      to: formatDateValue(day),
    })
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#101417] px-4 py-2 text-sm text-[#E0E5EB] transition-colors hover:border-white/20 hover:bg-white/5"
      >
        <CalendarDays className="h-4 w-4 text-[#F6D37A]" />
        {label}
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-30 mt-3 w-[320px] rounded-[24px] border border-white/10 bg-[#101417] p-4 shadow-2xl shadow-black/40">
          <div className="flex flex-wrap gap-2">
            {[
              { label: '7 días', value: 7 },
              { label: '30 días', value: 30 },
              { label: '90 días', value: 90 },
            ].map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setPreset(preset.value)}
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-[#B5BDCA] transition-colors hover:border-white/20 hover:bg-white/5"
              >
                {preset.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onChange({ from: null, to: null })}
              className="rounded-full border border-[#B8860B]/25 px-3 py-1.5 text-xs text-[#F6D37A] transition-colors hover:bg-[#B8860B]/10"
            >
              Limpiar
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
              className="rounded-full border border-white/10 p-2 text-[#8D95A6] transition-colors hover:border-white/20 hover:text-[#E0E5EB]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-medium text-[#E0E5EB]">
              {format(visibleMonth, 'MMMM yyyy', { locale: es })}
            </p>
            <button
              type="button"
              onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
              className="rounded-full border border-white/10 p-2 text-[#8D95A6] transition-colors hover:border-white/20 hover:text-[#E0E5EB]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1">
            {weekdayLabels.map((label) => (
              <div
                key={label}
                className="flex h-8 items-center justify-center text-[11px] uppercase tracking-[0.2em] text-[#4E576A]"
              >
                {label}
              </div>
            ))}
            {calendarDays.map((day) => {
              const isRangeStart = fromDate ? isSameDay(day, fromDate) : false
              const isRangeEnd = toDate ? isSameDay(day, toDate) : false
              const isSelected =
                isRangeStart ||
                isRangeEnd ||
                (fromDate &&
                  toDate &&
                  isAfter(day, fromDate) &&
                  isBefore(day, toDate))

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleDaySelect(day)}
                  className={cn(
                    'flex h-10 items-center justify-center rounded-xl text-sm transition-colors',
                    isSelected
                      ? 'bg-[#B8860B]/20 text-[#F6D37A]'
                      : 'text-[#B5BDCA] hover:bg-white/5 hover:text-[#E0E5EB]',
                    !isSameMonth(day, visibleMonth) && 'text-[#4E576A]',
                    (isRangeStart || isRangeEnd) &&
                      'bg-[#F6D37A] font-medium text-[#101417]'
                  )}
                >
                  {format(day, 'd')}
                </button>
              )
            })}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs text-[#8D95A6]">
              Desde
              <input
                type="date"
                value={value.from ?? ''}
                onChange={(event) =>
                  onChange({
                    from: event.target.value || null,
                    to: value.to,
                  })
                }
                className="rounded-2xl border border-white/10 bg-[#171B22] px-3 py-2 text-sm text-[#E0E5EB] focus:outline-none"
              />
            </label>
            <label className="grid gap-1.5 text-xs text-[#8D95A6]">
              Hasta
              <input
                type="date"
                value={value.to ?? ''}
                onChange={(event) =>
                  onChange({
                    from: value.from,
                    to: event.target.value || null,
                  })
                }
                className="rounded-2xl border border-white/10 bg-[#171B22] px-3 py-2 text-sm text-[#E0E5EB] focus:outline-none"
              />
            </label>
          </div>
        </div>
      ) : null}
    </div>
  )
}
