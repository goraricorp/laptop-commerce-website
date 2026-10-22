/* eslint-disable react/prop-types */

import { useState } from 'react'
import { ChevronsUpDown, Plus } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'

export function TeamSwitcher({ teams }) {
  const { isMobile } = useSidebar()
  const [activeTeam, setActiveTeam] = useState(teams[0])
  if (!activeTeam) return null
  const ActiveLogo = activeTeam.logo

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton className="h-14 data-[state=open]:bg-sidebar-accent" size="lg" />}>
            <span className="flex aspect-square size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground"><ActiveLogo className="size-4" /></span>
            <span className="grid flex-1 text-left text-sm leading-tight"><span className="truncate font-medium">{activeTeam.name}</span><span className="truncate text-xs">{activeTeam.plan}</span></span>
            <ChevronsUpDown className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-56 rounded-lg" side={isMobile ? 'bottom' : 'right'} sideOffset={4}>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Nhóm làm việc</DropdownMenuLabel>
              {teams.map((team, index) => {
                const Logo = team.logo
                return (
                  <DropdownMenuItem className="h-9 gap-2" key={team.name} onClick={() => setActiveTeam(team)}>
                    <span className="flex size-6 items-center justify-center rounded-md border"><Logo className="size-3.5" /></span>
                    {team.name}<DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="h-9 gap-2"><span className="flex size-6 items-center justify-center rounded-md border"><Plus className="size-4" /></span>Thêm nhóm</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
