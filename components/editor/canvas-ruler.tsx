'use client'

import { cn } from '@/lib/utils'

type CanvasRulerProps = {
  canvasSize: number
  orientation: 'horizontal' | 'vertical'
  scale: number
  canvasLeft: number
  canvasTop: number
}

const RULER_SIZE = 20

export function CanvasRuler({
  canvasSize,
  orientation,
  scale,
  canvasLeft,
  canvasTop,
}: CanvasRulerProps) {
  const totalLength = canvasSize * scale
  const majorStep = 100
  const minorStep = 25

  const majorMarks = Array.from(
    { length: Math.floor(canvasSize / majorStep) + 1 },
    (_, index) => index * majorStep
  )
  const minorMarks = Array.from(
    { length: Math.floor(canvasSize / minorStep) + 1 },
    (_, index) => index * minorStep
  ).filter((value) => value % majorStep !== 0)

  const isHorizontal = orientation === 'horizontal'

  return (
    <div
      className={cn('absolute pointer-events-none')}
      style={{
        left: isHorizontal ? canvasLeft : canvasLeft - RULER_SIZE,
        top: isHorizontal ? canvasTop - RULER_SIZE : canvasTop,
        width: isHorizontal ? totalLength : RULER_SIZE,
        height: isHorizontal ? RULER_SIZE : totalLength,
        background: '#0D1014',
        borderRight: !isHorizontal ? '1px solid rgba(255,255,255,0.08)' : 'none',
        borderBottom: isHorizontal ? '1px solid rgba(255,255,255,0.08)' : 'none',
        overflow: 'hidden',
      }}
    >
      {minorMarks.map((value) => {
        const pos = value * scale

        return (
          <div
            key={`minor-${value}`}
            className="absolute bg-white/15"
            style={{
              ...(isHorizontal
                ? { left: pos, top: RULER_SIZE - 5, width: 1, height: 5 }
                : { top: pos, left: RULER_SIZE - 5, height: 1, width: 5 }),
            }}
          />
        )
      })}

      {majorMarks.map((value) => {
        const pos = value * scale

        return (
          <div
            key={`major-${value}`}
            className="absolute"
            style={
              isHorizontal ? { left: pos, top: 0, height: RULER_SIZE } : { top: pos, left: 0, width: RULER_SIZE }
            }
          >
            <div
              className="absolute bg-white/30"
              style={
                isHorizontal
                  ? { bottom: 0, left: 0, width: 1, height: 10 }
                  : { right: 0, top: 0, height: 1, width: 10 }
              }
            />
            {value > 0 && (
              <span
                className="absolute select-none font-mono text-[8px] text-white/40"
                style={
                  isHorizontal
                    ? { top: 2, left: 3 }
                    : {
                        top: 2,
                        left: 2,
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                      }
                }
              >
                {value}
              </span>
            )}
          </div>
        )
      })}

      {isHorizontal && (
        <div
          className="absolute top-0 left-0 border-r border-b border-white/8 bg-[#0D1014]"
          style={{ width: RULER_SIZE, height: RULER_SIZE, left: -RULER_SIZE }}
        />
      )}
    </div>
  )
}
