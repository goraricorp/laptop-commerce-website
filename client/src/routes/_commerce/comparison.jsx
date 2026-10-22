import { createFileRoute } from "@tanstack/react-router";
import Comparison from "@/pages/overview/comparison";
export const Route = createFileRoute("/_commerce/comparison")({
  component: Comparison,
});
