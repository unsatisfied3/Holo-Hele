import { createFileRoute, getRouteApi } from "@tanstack/react-router";

import { StopDetailScreen } from "@/components/stops/StopDetailScreen";

const stopRoute = getRouteApi("/stops/$id");

export const Route = createFileRoute("/stops/$id/")({
  component: StopPage,
});

function StopPage() {
  const stop = stopRoute.useLoaderData();
  const search = stopRoute.useSearch();
  return <StopDetailScreen stop={stop} fromFavorites={search.from === "favorites"} />;
}
