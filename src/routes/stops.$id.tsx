import {
  createFileRoute,
  Link,
  notFound,
  Outlet,
} from "@tanstack/react-router";

import { fetchStopLocation } from "@/lib/api/transit";
import { getStopById } from "@/lib/thebus/stops";

interface StopSearch {
  from?: "favorites";
}

export const Route = createFileRoute("/stops/$id")({
  validateSearch: (search: Record<string, unknown>): StopSearch => ({
    from: search.from === "favorites" ? "favorites" : undefined,
  }),
  loader: async ({ params }) => {
    const bundledStop = getStopById(params.id);
    if (bundledStop) return bundledStop;

    try {
      const { stop } = await fetchStopLocation(params.id);
      return stop;
    } catch {
      throw notFound();
    }
  },
  component: Outlet,
  notFoundComponent: StopNotFound,
});

function StopNotFound() {
  return (
    <main className="app-shell flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold text-ink">Stop not found</h1>
      <p className="text-sm text-body">
        That stop is not available in the current official schedule.
      </p>
      <Link
        to="/home"
        className="rounded-[var(--radius-pill)] bg-primary px-5 py-3 text-sm font-medium text-on-primary"
      >
        Back to map
      </Link>
    </main>
  );
}
