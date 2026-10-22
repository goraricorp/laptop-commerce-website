import { createFileRoute } from "@tanstack/react-router";
import Favorites from "@/pages/information/favorites";
export const Route = createFileRoute("/user/favorites")({
  component: Favorites,
});
