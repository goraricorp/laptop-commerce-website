import PropTypes from "prop-types";
import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight, CircleDot, CircleSmall } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";
function isPathActive(pathname, url) {
  return url !== "#" && pathname === url;
}
function NavItems({ items, ...props }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const { isMobile, setOpenMobile, state } = useSidebar();
  const [openItems, setOpenItems] = useState({});
  const closeMobile = () => {
    if (isMobile) setOpenMobile(false);
  };
  return (
    <SidebarGroup {...props}>
      <SidebarMenu>
        {items.map((item, index) => {
          const Icon = item.icon;
          const key = `${item.title}-${item.url}-${index}`;
          const directActive = isPathActive(pathname, item.url);
          const childActive = Boolean(
            item.items?.some((child) => isPathActive(pathname, child.url)),
          );
          const hasChildren = Boolean(item.items?.length);
          if (!hasChildren) {
            return (
              <SidebarMenuItem key={key}>
                <SidebarMenuButton
                  isActive={directActive}
                  render={<Link onClick={closeMobile} to={item.url} />}
                  tooltip={item.title}
                >
                  {Icon && <Icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }
          if (state === "collapsed" && !isMobile) {
            return (
              <SidebarMenuItem key={key}>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <SidebarMenuButton
                        aria-label={`Mở menu ${item.title}`}
                        isActive={directActive || childActive}
                        tooltip={item.title}
                      />
                    }
                  >
                    {Icon && <Icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ms-auto" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-56"
                    side="right"
                    sideOffset={4}
                  >
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {item.items.map((child) => {
                        const active = isPathActive(pathname, child.url);
                        return (
                          <DropdownMenuItem
                            className="h-9"
                            key={`${child.title}-${child.url}`}
                            render={
                              <Link
                                className={cn(
                                  "w-full",
                                  active && "bg-accent text-accent-foreground",
                                )}
                                onClick={closeMobile}
                                to={child.url}
                              />
                            }
                          >
                            {active ? (
                              <CircleDot className="shrink-0" />
                            ) : (
                              <CircleSmall className="shrink-0 text-muted-foreground" />
                            )}
                            <span className="max-w-48 text-wrap">
                              {child.title}
                            </span>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            );
          }
          const open = openItems[key] ?? childActive;
          return (
            <Collapsible
              className="group/collapsible"
              key={key}
              onOpenChange={(nextOpen) =>
                setOpenItems((current) => ({
                  ...current,
                  [key]: nextOpen,
                }))
              }
              open={open}
              render={<SidebarMenuItem />}
            >
              <CollapsibleTrigger
                render={
                  <SidebarMenuButton
                    isActive={directActive || (childActive && !open)}
                    tooltip={item.title}
                  />
                }
              >
                {Icon && <Icon />}
                <span>{item.title}</span>
                <ChevronRight className="ms-auto size-4 transition-transform duration-300 group-data-open/collapsible:rotate-90 rtl:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items.map((child) => {
                    const active = isPathActive(pathname, child.url);
                    return (
                      <SidebarMenuSubItem key={`${child.title}-${child.url}`}>
                        <SidebarMenuSubButton
                          isActive={active}
                          render={<Link onClick={closeMobile} to={child.url} />}
                        >
                          {active ? (
                            <CircleDot className="size-4 shrink-0" />
                          ) : (
                            <CircleSmall className="size-4 shrink-0 text-muted-foreground" />
                          )}
                          <span>{child.title}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    );
                  })}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
export function NavMaster(props) {
  return <NavItems {...props} />;
}
export function NavOrigin(props) {
  return <NavItems {...props} />;
}
export function NavCapital(props) {
  return <NavItems {...props} />;
}
export function NavMain(props) {
  return <NavItems {...props} />;
}
export function NavSub(props) {
  return <NavItems {...props} />;
}
NavItems.propTypes = {
  items: PropTypes.array,
};
