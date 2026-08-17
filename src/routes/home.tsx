import { createFileRoute } from "@tanstack/react-router";

import { HomeScreen } from "@/components/home/HomeScreen";

export const Route = createFileRoute("/home")({
  component: HomeScreen,
});
