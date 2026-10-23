import type { FC, ReactNode } from 'react'
import { SidebarInset, SidebarProvider } from '#/components/ui/sidebar'
import { AppHeader } from '#/components/layout/app-header'
import { AppSidebar } from '#/components/layout/app-sidebar'
import { usePreferencesStore } from '#/stores/preferences-store'

interface AppShellProps {
  user: { name: string; email: string; image: string | null }
  ponds?: Array<{ code: string; name: string }>
  onSignOut: () => void
  children: ReactNode
}

export const AppShell: FC<AppShellProps> = ({
  user,
  ponds = [],
  onSignOut,
  children,
}) => {
  const sidebarOpen = usePreferencesStore((state) => state.sidebarOpen)
  const setSidebarOpen = usePreferencesStore((state) => state.setSidebarOpen)

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <AppSidebar ponds={ponds} />
      <SidebarInset className="h-svh min-w-0 overflow-hidden">
        <AppHeader user={user} onSignOut={onSignOut} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-auto p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
