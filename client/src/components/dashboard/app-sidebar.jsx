import PropTypes from "prop-types";
import { Link } from "@tanstack/react-router";
import { Command } from "lucide-react";
import { NavMaster } from "@/components/dashboard/nav-main";
import { NavProjects } from "@/components/dashboard/nav-projects";
import { NavSecondary } from "@/components/dashboard/nav-secondary";
import { NavUser } from "@/components/dashboard/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useLayout } from "@/hooks/use-layout";
export function AppSidebar({ global, onLogout, sidebar, user, ...props }) {
  const { collapsible, variant } = useLayout();
  return (
    <Sidebar collapsible={collapsible} variant={variant} {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="h-14"
              render={<Link to="/" />}
              size="lg"
            >
              <span className="flex aspect-square size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                {global?.logo ? (
                  <img
                    alt={global.name}
                    className="size-9 rounded-md"
                    src={global.logo}
                  />
                ) : (
                  <Command className="size-4" />
                )}
              </span>
              <span className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate text-base font-semibold">
                  {global?.name || "Webkitlab"}
                </span>
                <span className="truncate text-xs">
                  {global?.plan || "Quản lý hệ thống"}
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMaster items={sidebar.main || []} />
        {sidebar.secondary?.length > 0 && <SidebarSeparator className="mx-0" />}
        <NavSecondary items={sidebar.secondary || []} />
        {sidebar.projects?.length > 0 && <SidebarSeparator className="mx-0" />}
        <NavProjects className="mt-auto" projects={sidebar.projects || []} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser onLogout={onLogout} user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
AppSidebar.propTypes = {
  global: PropTypes.object,
  onLogout: PropTypes.func,
  sidebar: PropTypes.object,
  user: PropTypes.object,
};
