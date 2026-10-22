import { createFileRoute } from "@tanstack/react-router";
import MyReviews from "@/pages/information/my-reviews";
export const Route = createFileRoute("/user/rating")({ component: MyReviews });
