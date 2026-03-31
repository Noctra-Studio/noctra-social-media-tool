"use client";

import React from "react";
import { cn } from "@/lib/utils";

type CanvasRulerProps = {
  scale: number;
  canvasSize: number;
  orientation: "horizontal" | "vertical";
};

export function CanvasRuler({ scale, canvasSize, orientation }: CanvasRulerProps) {
  const segments = Array.from({ length: Math.ceil(canvasSize / 100) + 1 });
  
  return (
    <div 
      className={cn(
        "absolute bg-[#0F1317] border-white/5 overflow-hidden",
        orientation === "horizontal" 
          ? "top-[-32px] left-0 right-0 h-8 border-b" 
          : "top-0 left-[-32px] bottom-0 w-8 border-r"
      )}
      style={{
        width: orientation === "horizontal" ? canvasSize * scale : undefined,
        height: orientation === "vertical" ? canvasSize * scale : undefined,
      }}
    >
      <div className="relative flex h-full w-full">
        {segments.map((_, i) => (
          <div 
            key={i}
            className={cn(
              "absolute",
              orientation === "horizontal" ? "top-0" : "left-0"
            )}
            style={{
              [orientation === "horizontal" ? "left" : "top"]: (i * 100) * scale,
            }}
          >
            <div 
              className={cn(
                "bg-[#4E576A]",
                orientation === "horizontal" ? "w-[1px] h-3" : "h-[1px] w-3"
              )} 
            />
            <span 
              className={cn(
                "absolute text-[#4E576A] font-mono text-[9px] select-none",
                orientation === "horizontal" ? "top-3 left-1" : "top-1 left-3"
              )}
            >
              {i * 100}
            </span>
            
            {/* Small ticks */}
            {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(tick => (
              <div 
                key={tick}
                className={cn(
                  "absolute bg-white/10",
                  orientation === "horizontal" ? "w-[1px] h-1.5" : "h-[1px] w-1.5"
                )}
                style={{
                  [orientation === "horizontal" ? "left" : "top"]: tick * scale,
                  [orientation === "horizontal" ? "top" : "left"]: 0,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
