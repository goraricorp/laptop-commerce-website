import PropTypes from "prop-types";
import { Link } from "@tanstack/react-router";
import { Folder, MoreHorizontal, Share, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";
export function NavProjects({ className, projects }) {
  const { isMobile } = useSidebar();
  if (!projects.length) return null;
  return (
    <SidebarGroup
      className={cn("group-data-[collapsible=icon]:hidden", className)}
    >
      <SidebarGroupLabel className="font-medium">Khám phá</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => {
          const Icon = item.icon;
          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton render={<Link to={item.url} />}>
                {Icon && <Icon />}
                <span>{item.name}</span>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuAction
                      aria-label={`Thao tác với ${item.name}`}
                      showOnHover
                    />
                  }
                >
                  <MoreHorizontal />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align={isMobile ? "end" : "start"}
                  className="w-48"
                  side={isMobile ? "bottom" : "right"}
                >
                  <DropdownMenuItem className="h-9">
                    <Folder /> Xem mục
                  </DropdownMenuItem>
                  <DropdownMenuItem className="h-9">
                    <Share /> Chia sẻ
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="h-9" variant="destructive">
                    <Trash2 /> Xóa mục
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
NavProjects.propTypes = {
  className: PropTypes.string,
  projects: PropTypes.array,
};
