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
import { appGlobal, settingsSidebar } from "@/config/sidebar";
import { useAuth } from "@/hooks/auth-context";
import { useLayout } from "@/hooks/use-layout";
export default function SettingsLayout({ children }) {
  const { authenticated, loading, logout, user } = useAuth();
  const { setSidebarOpen, sidebarOpen } = useLayout();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  if (loading) {
    return (
      <div className="grid min-h-svh place-items-center">
        <Spinner className="size-8" />
      </div>
    );
  }
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
  return (
    <SidebarProvider onOpenChange={setSidebarOpen} open={sidebarOpen}>
      <AppSidebar
        global={appGlobal}
        onLogout={logout}
        sidebar={settingsSidebar}
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
SettingsLayout.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
};
