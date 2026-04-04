import { DocsSidebar } from '@/components/docs/DocsSidebar'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[220px] min-w-[220px] border-r border-white/[0.07] bg-[#0b0e10] overflow-y-auto flex-shrink-0">
        <DocsSidebar />
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto bg-[#0e1215]">
        {children}
      </main>
    </div>
  )
}
