import { useAuth } from "@/hooks/auth-context";
import TwoFactorPage from "@/pages/authentication/two-factor-page";
import { Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { NavigationProgress } from "@/components/element/navigation-progress";
import { Toaster } from "@/components/ui/toast";
import "@bprogress/core/css";
import "@/styles/globals.css";
export default function Root() {
  const { user, session } = useAuth();
  if (user?.twoFactorEnabled && !session?.secondFactorAt)
    return (
      <>
        <TwoFactorPage />
        <Toaster />
      </>
    );
  return (
    <>
      <NavigationProgress />
      <Outlet />
      <Toaster />
      <TanStackDevtools
        config={{
          position: "bottom-right",
        }}
        plugins={[
          {
            name: "TanStack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </>
  );
}
export function NotFound() {
  return (
    <main>
      <h1>404</h1>
      <p>Page not found.</p>
    </main>
  );
}
