/* eslint-disable react/prop-types */

import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Command } from 'lucide-react'

import { NavUser } from '@/components/dashboard/nav-user'
import { Label } from '@/components/ui/label'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

export function MessSidebar({ data, onLogout, ...props }) {
  const [activeItem, setActiveItem] = useState(data.navMain?.[0])
  const [messages, setMessages] = useState(data.navMessage || [])
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [query, setQuery] = useState('')
  const { setOpenMobile } = useSidebar()
  const visibleMessages = messages.filter((message) => {
    const matchesQuery = `${message.name} ${message.subject} ${message.teaser}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (!unreadOnly || message.unread)
  })

  return (
    <Sidebar className="overflow-hidden *:data-[sidebar=sidebar]:flex-row" collapsible="icon" {...props}>
      <Sidebar className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r" collapsible="none">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="md:p-0" render={<Link to="/" />}>
                <span className="flex size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                  {data.brand?.logo ? <img alt={data.brand.name} className="size-9 rounded-md" src={data.brand.logo} /> : <Command className="size-4" />}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {(data.navMain || []).map((item) => {
                  const Icon = item.icon
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton className="px-2.5" isActive={activeItem?.title === item.title} onClick={() => { setActiveItem(item); setMessages(data.navMessage || []) }} tooltip={item.title}>
                        {Icon && <Icon />}<span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter><NavUser onLogout={onLogout} user={data.user} /></SidebarFooter>
      </Sidebar>

      <Sidebar className="hidden flex-1 md:flex" collapsible="none">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <span className="flex w-full items-center justify-between">
            <span className="font-medium text-foreground">{activeItem?.title || 'Tin nhắn'}</span>
            <Label className="flex items-center gap-2 text-sm"><span>Chưa đọc</span><Switch checked={unreadOnly} onCheckedChange={setUnreadOnly} /></Label>
          </span>
          <SidebarInput onChange={(event) => setQuery(event.target.value)} placeholder="Tìm kiếm tin nhắn…" value={query} />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              {visibleMessages.map((message) => (
                <Link
                  className={cn('flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight hover:bg-sidebar-accent', message.unread && 'bg-sidebar-accent/50')}
                  key={message.email || message.id}
                  onClick={() => setOpenMobile(false)}
                  to="/chatbot"
                >
                  <span className="flex w-full items-center gap-2"><span>{message.name}</span><span className="ml-auto text-xs">{message.date}</span></span>
                  <span className="font-medium">{message.subject}</span>
                  <span className="line-clamp-2 w-full text-xs text-muted-foreground">{message.teaser}</span>
                </Link>
              ))}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  )
}
