import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import "@fontsource-variable/geist/wght.css";
import "@fontsource-variable/inter/wght.css";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/hooks/use-cart";
import { DirectionProvider } from "@/providers/direction";
import { FontProvider } from "@/providers/font";
import { LayoutProvider } from "@/providers/layout";
import { ThemeProvider } from "@/providers/theme";
import { router } from "@/router";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

// declare module '@tanstack/react-router' {
//   interface Register {
//     router: typeof router
//   }
// }

const rootElement = document.getElementById("app");

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <FontProvider>
          <DirectionProvider>
            <LayoutProvider>
              <AuthProvider>
                <CartProvider>
                  <RouterProvider router={router} />
                </CartProvider>
              </AuthProvider>
            </LayoutProvider>
          </DirectionProvider>
        </FontProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}
