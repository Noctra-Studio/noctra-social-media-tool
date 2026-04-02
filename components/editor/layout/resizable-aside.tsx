"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

interface ResizableAsideProps {
  side: "left" | "right";
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  children: React.ReactNode;
  className?: string;
  onWidthChange?: (width: number) => void;
}

export function ResizableAside({
  side,
  defaultWidth,
  minWidth,
  maxWidth,
  children,
  className,
  onWidthChange
}: ResizableAsideProps) {
  const [width, setWidth] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`noctra:editor:aside:${side}`);
      if (saved) return Number(saved);
    }
    return defaultWidth;
  });

  const isResizing = useRef(false);
  const [active, setActive] = useState(false);

  const startResizing = useCallback(() => {
    isResizing.current = true;
    setActive(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    setActive(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  const resize = useCallback(
    (event: MouseEvent) => {
      if (!isResizing.current) return;

      let newWidth: number;
      if (side === "left") {
        newWidth = event.clientX;
      } else {
        newWidth = window.innerWidth - event.clientX;
      }

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
        onWidthChange?.(newWidth);
        localStorage.setItem(`noctra:editor:aside:${side}`, String(newWidth));
      }
    },
    [maxWidth, minWidth, onWidthChange, side]
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  return (
    <aside
      className={cn(
        "relative flex h-full flex-col bg-[var(--editor-panel)] transition-[width] duration-75",
        side === "left" ? "border-r border-[var(--editor-border)]" : "border-l border-[var(--editor-border)]",
        className
      )}
      style={{ width: `${width}px` }}
    >
      <div className="flex h-full flex-col overflow-hidden">{children}</div>

      {/* Resize Handle */}
      <div
        onMouseDown={startResizing}
        className={cn(
          "absolute top-0 flex h-full w-1 cursor-col-resize items-center justify-center transition-colors hover:bg-[var(--editor-accent)]",
          side === "left" ? "right-0 translate-x-1/2" : "left-0 -translate-x-1/2",
          active && "bg-[var(--editor-accent)]"
        )}
      />
    </aside>
  );
}
