import { createFileRoute, getRouteApi } from "@tanstack/react-router";

import { TrackingScreen } from "@/components/tracking/TrackingScreen";

const stopRoute = getRouteApi("/stops/$id");

export const Route = createFileRoute("/stops/$id/track/$arrivalId")({
  component: TrackPage,
});

function TrackPage() {
  const stop = stopRoute.useLoaderData();
  const { arrivalId } = Route.useParams();
  return <TrackingScreen stop={stop} arrivalId={arrivalId} />;
}
