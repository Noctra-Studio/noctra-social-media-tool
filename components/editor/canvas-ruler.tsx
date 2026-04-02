'use client'

import { cn } from '@/lib/utils'

type CanvasRulerProps = {
  canvasSize: number
  orientation: 'horizontal' | 'vertical'
  scale: number
  offset: number
}

const RULER_SIZE = 20

export function CanvasRuler({
  canvasSize,
  orientation,
  scale,
  offset,
}: CanvasRulerProps) {
  const isHorizontal = orientation === 'horizontal'
  const majorStep = 100
  const minorStep = 25

  // Generate enough marks to cover reasonably large viewports + canvas
  const marksCount = Math.floor(canvasSize / minorStep) + 1
  const allMarks = Array.from({ length: marksCount }, (_, i) => i * minorStep)

  return (
    <div
      className={cn(
        'absolute pointer-events-none bg-[#0D1014] overflow-hidden select-none',
        isHorizontal ? 'top-0 left-0 right-0 h-[20px]' : 'top-0 left-0 bottom-0 w-[20px]'
      )}
      style={{
        borderRight: !isHorizontal ? '1px solid rgba(255,255,255,0.08)' : 'none',
        borderBottom: isHorizontal ? '1px solid rgba(255,255,255,0.08)' : 'none',
        zIndex: 40
      }}
    >
      <div 
        className="absolute"
        style={{
          transform: isHorizontal ? `translateX(${offset}px)` : `translateY(${offset}px)`,
        }}
      >
        {allMarks.map((value) => {
          const isMajor = value % majorStep === 0
          const pos = value * scale

          return (
            <div
              key={value}
              className="absolute"
              style={
                isHorizontal 
                  ? { left: pos, top: 0, height: RULER_SIZE, width: 1 } 
                  : { top: pos, left: 0, width: RULER_SIZE, height: 1 }
              }
            >
              {/* Tick Mark */}
              <div
                className={cn("absolute bg-white/15", isMajor ? "bg-white/30" : "bg-white/10")}
                style={
                  isHorizontal
                    ? { bottom: 0, left: 0, width: 1, height: isMajor ? 10 : 5 }
                    : { right: 0, top: 0, height: 1, width: isMajor ? 10 : 5 }
                }
              />
              
              {/* Value Label */}
              {isMajor && value > 0 && (
                <span
                  className="absolute font-mono text-[8px] text-white/40"
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
      </div>
    </div>
  )
}
