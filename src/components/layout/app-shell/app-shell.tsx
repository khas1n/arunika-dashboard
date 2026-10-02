import { SidebarInset, SidebarProvider } from '#/components/ui/sidebar'
import { AppHeader } from '#/components/layout/app-header'
import { AppSidebar } from '#/components/layout/app-sidebar'
import { usePreferencesStore } from '#/stores/preferences-store'

export function AppShell({
  user,
  onSignOut,
  children,
}: {
  user: { name: string; email: string; image: string | null }
  onSignOut: () => void
  children: React.ReactNode
}) {
  const sidebarOpen = usePreferencesStore((state) => state.sidebarOpen)
  const setSidebarOpen = usePreferencesStore((state) => state.setSidebarOpen)

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <AppSidebar />
      <SidebarInset>
        <AppHeader user={user} onSignOut={onSignOut} />
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
