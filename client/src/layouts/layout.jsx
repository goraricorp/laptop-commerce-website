import PropTypes from "prop-types";
import { Navigate, Outlet, useRouterState } from "@tanstack/react-router";
import { Copyright } from "@/components/block/copyright";
import { Spinner } from "@/components/ui/spinner";
import { Header } from "@/components/block/header";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { adminSidebar, appGlobal, moderatorSidebar } from "@/config/sidebar";
import { useAuth } from "@/hooks/auth-context";
import { useLayout } from "@/hooks/use-layout";
const managementRoles = new Set(["moderator", "administrator", "master"]);
const moderatorPaths = ["/admin/reviews", "/admin/chat"];
export default function Layout({ children }) {
  const { authenticated, loading, logout, user } = useAuth();
  const { setSidebarOpen, sidebarOpen } = useLayout();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  if (loading)
    return (
      <div className="grid min-h-svh place-items-center">
        <Spinner className="size-8" />
      </div>
    );
  if (!authenticated)
    return (
      <Navigate
        replace
        search={{
          redirect: pathname,
        }}
        to="/auth/sign-in"
      />
    );
  if (!managementRoles.has(user?.role))
    return <Navigate replace to="/auth/not-authorized" />;
  if (
    user?.role === "moderator" &&
    !moderatorPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    )
  )
    return <Navigate replace to="/admin/reviews" />;
  return (
    <SidebarProvider onOpenChange={setSidebarOpen} open={sidebarOpen}>
      <AppSidebar
        global={appGlobal}
        onLogout={logout}
        sidebar={user?.role === "moderator" ? moderatorSidebar : adminSidebar}
        user={user}
      />
      <SidebarInset>
        <Header showLogo={false} showNavigation={false}>
          <SidebarTrigger className="size-9" />
        </Header>
        <main className="flex flex-1 flex-col">
          <div className="container mx-auto p-6">{children ?? <Outlet />}</div>
        </main>
        <Copyright />
      </SidebarInset>
    </SidebarProvider>
  );
}
Layout.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
};
