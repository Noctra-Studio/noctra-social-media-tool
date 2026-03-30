'use client'

import { TopNavbar } from '@/components/layout/TopNavbar'

type AppShellProps = {
  children: React.ReactNode
  userEmail: string
  userName: string
}

export function AppShell({ children, userEmail, userName }: AppShellProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <TopNavbar userEmail={userEmail} userName={userName} />

      <div className="flex min-h-[calc(100vh-4rem)] flex-col">
        <main className="min-w-0 flex-1">
          <div className="mx-auto flex h-full w-full max-w-[1440px] flex-1 px-6 py-6 pb-24 md:px-10 md:py-8 md:pb-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
