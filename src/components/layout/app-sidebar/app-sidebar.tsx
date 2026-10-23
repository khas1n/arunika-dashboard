import type { FC } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { Home, Package, Settings, UserRound, Waves } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '#/components/ui/sidebar'

const items = [
  { to: '/', label: 'Beranda', icon: Home },
  { to: '/profile', label: 'Profil', icon: UserRound },
  { to: '/settings', label: 'Pengaturan', icon: Settings },
] as const

interface AppSidebarProps {
  ponds?: Array<{ code: string; name: string }>
}

export const AppSidebar: FC<AppSidebarProps> = ({ ponds = [] }) => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const onKolam = pathname === '/kolam' || pathname.startsWith('/kolam/')

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-3">
        <span className="truncate text-sm font-semibold">Arunika</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/'}
                  tooltip="Beranda"
                >
                  <Link to={items[0].to}>
                    <Home />
                    <span>Beranda</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/pakan'}
                  tooltip="Pakan"
                >
                  <Link to="/pakan">
                    <Package />
                    <span>Pakan</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={onKolam} tooltip="Kolam">
                  <Link to="/kolam">
                    <Waves />
                    <span>Kolam</span>
                  </Link>
                </SidebarMenuButton>
                {ponds.length > 0 ? (
                  <SidebarMenuSub>
                    {ponds.map((pond) => (
                      <SidebarMenuSubItem key={pond.code}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={pathname === `/kolam/${pond.code}`}
                        >
                          <Link
                            to="/kolam/$pondCode"
                            params={{ pondCode: pond.code }}
                          >
                            <span>{pond.code}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
              {items.slice(1).map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.to}
                    tooltip={item.label}
                  >
                    <Link to={item.to}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
