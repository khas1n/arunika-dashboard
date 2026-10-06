import type { FC } from 'react'
import { SidebarTrigger } from '#/components/ui/sidebar'
import { ThemeToggle } from '#/components/layout/theme-toggle'
import { UserMenu } from '#/components/layout/user-menu'

interface AppHeaderProps {
  user: { name: string; email: string; image: string | null }
  onSignOut: () => void
}

export const AppHeader: FC<AppHeaderProps> = ({ user, onSignOut }) => {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <UserMenu
          name={user.name}
          email={user.email}
          image={user.image}
          onSignOut={onSignOut}
        />
      </div>
    </header>
  )
}
