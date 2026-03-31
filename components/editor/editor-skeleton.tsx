"use client";

export function EditorSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0C0F] text-[#E0E5EB]">
      <div className="w-full max-w-5xl space-y-4 px-6">
        <div className="h-12 rounded-2xl border border-white/10 bg-[#14171C] animate-pulse" />
        <div className="grid min-h-[70vh] grid-cols-[180px_minmax(0,1fr)_240px] gap-4 max-xl:grid-cols-[180px_minmax(0,1fr)] max-md:grid-cols-1">
          <div className="rounded-3xl border border-white/10 bg-[#11151A] animate-pulse" />
          <div className="rounded-3xl border border-white/10 bg-[#141418] animate-pulse" />
          <div className="rounded-3xl border border-white/10 bg-[#11151A] animate-pulse max-xl:hidden" />
        </div>
      </div>
    </div>
  )
}
