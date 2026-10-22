import PropTypes from "prop-types";
import { Link } from "@tanstack/react-router";
import {
  Bell,
  ChevronsUpDown,
  LogIn,
  LogOut,
  ReceiptText,
  Settings,
  UserRound,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/hooks/use-sidebar";
function formatInitials(user) {
  return (
    user?.name?.trim()?.slice(0, 2).toUpperCase() ||
    user?.email?.slice(0, 2).toUpperCase() ||
    "ND"
  );
}
const administratorRoles = new Set(["moderator", "administrator", "master"]);
export function NavAvatar({ user }) {
  return (
    <Avatar className="size-9 rounded-md after:rounded-md">
      <AvatarImage
        alt={user?.name || "Người dùng"}
        className="rounded-md"
        src={user?.image || user?.avatar || undefined}
      />
      <AvatarFallback className="rounded-md">
        {formatInitials(user)}
      </AvatarFallback>
    </Avatar>
  );
}
export function NavName({ user }) {
  return (
    <span className="grid flex-1 text-left text-sm leading-tight">
      <span className="truncate font-medium">{user?.name || "Người dùng"}</span>
      <span className="truncate text-xs text-muted-foreground">
        {user?.email || "Chưa có email"}
      </span>
    </span>
  );
}
export function NavDropdownItem({ action, icon: Icon, link, title }) {
  if (link) {
    return (
      <DropdownMenuItem className="h-9" render={<Link to={link} />}>
        <Icon className="size-4" /> {title}
      </DropdownMenuItem>
    );
  }
  return (
    <DropdownMenuItem className="h-9" onClick={action}>
      <Icon className="size-4" /> {title}
    </DropdownMenuItem>
  );
}
export function NavUserDropdown({ onLogout, user }) {
  return (
    <>
      <DropdownMenuGroup>
        <DropdownMenuLabel className="p-1 font-normal">
          <span className="flex items-center gap-2 text-left">
            <NavAvatar user={user} />
            <NavName user={user} />
          </span>
        </DropdownMenuLabel>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      {user ? (
        <>
          <DropdownMenuGroup>
            <NavDropdownItem
              icon={UserRound}
              link="/user/profile"
              title="Hồ sơ cá nhân"
            />
            <NavDropdownItem
              icon={ReceiptText}
              link="/user/order"
              title="Đơn hàng của tôi"
            />
            {administratorRoles.has(user?.role) && (
              <NavDropdownItem
                icon={Settings}
                link="/admin/account/settings"
                title="Cài đặt quản trị"
              />
            )}
            {administratorRoles.has(user?.role) && (
              <NavDropdownItem
                icon={Bell}
                link="/admin/account/notifications"
                title="Thông báo quản trị"
              />
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <NavDropdownItem
              action={onLogout}
              icon={LogOut}
              title="Đăng xuất"
            />
          </DropdownMenuGroup>
        </>
      ) : (
        <DropdownMenuGroup>
          <NavDropdownItem
            icon={LogIn}
            link="/auth/sign-in"
            title="Đăng nhập"
          />
        </DropdownMenuGroup>
      )}
    </>
  );
}
export function NavUser({ onLogout, type = "sidebar", user }) {
  const { isMobile } = useSidebar();
  const triggerContent = (
    <>
      <NavAvatar user={user} />
      <NavName user={user} />
      <ChevronsUpDown className="ml-auto size-4" />
    </>
  );
  if (type === "navbar") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label="Mở menu người dùng"
              className="size-9 rounded-md p-0"
              size="icon"
              variant="ghost"
            />
          }
        >
          <NavAvatar user={user} />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-56 rounded-lg"
          side="bottom"
          sideOffset={4}
        >
          <NavUserDropdown onLogout={onLogout} user={user} />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                className="h-14 data-[state=open]:bg-sidebar-accent"
                size="lg"
              />
            }
          >
            {triggerContent}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <NavUserDropdown onLogout={onLogout} user={user} />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
export function NavUserX(props) {
  return <NavUser {...props} />;
}
NavAvatar.propTypes = {
  user: PropTypes.object,
};
NavName.propTypes = {
  user: PropTypes.object,
};
NavDropdownItem.propTypes = {
  action: PropTypes.func,
  icon: PropTypes.node,
  link: PropTypes.string,
  title: PropTypes.node,
};
NavUserDropdown.propTypes = {
  onLogout: PropTypes.func,
  user: PropTypes.object,
};
NavUser.propTypes = {
  onLogout: PropTypes.func,
  type: PropTypes.string,
  user: PropTypes.object,
};
