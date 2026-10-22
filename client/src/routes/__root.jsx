import { createRootRoute } from "@tanstack/react-router";
import Root, { NotFound } from "@/layouts/root";
export const Route = createRootRoute({
  component: Root,
  notFoundComponent: NotFound,
});
