import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { DirectionsMap } from "@/components/directions/DirectionsMap";
import { FigmaIcon, RouteLineBadge } from "@/components/icons/FigmaIcon";
import { Button } from "@/components/ui/Button";
import { JOURNEY_OPTIONS } from "@/lib/mock/journeys";

interface LiveDirectionsSearch {
  destination: string;
}

export const Route = createFileRoute("/live-directions/$journeyId")({
  validateSearch: (search): LiveDirectionsSearch => ({
    destination:
      typeof search.destination === "string" && search.destination.trim()
        ? search.destination
        : "University of Hawaiʻi at Mānoa",
  }),
  loader: ({ params }) => {
    const journey = JOURNEY_OPTIONS.find((item) => item.id === params.journeyId);
    if (!journey) throw notFound();
    return journey;
  },
  component: LiveDirectionsPage,
});

function LiveDirectionsPage() {
  const journey = Route.useLoaderData();
  const { destination } = Route.useSearch();
  const [saved, setSaved] = useState(false);

  return (
    <main className="app-shell relative h-dvh overflow-hidden bg-canvas">
      <div className="absolute inset-0">
        <DirectionsMap showControls={false} />
      </div>

      <header className="absolute inset-x-0 top-0 z-[1200] flex min-h-16 items-center border-b border-hairline bg-canvas px-3 pt-[env(safe-area-inset-top)]">
        <Link
          to="/directions/$journeyId"
          params={{ journeyId: journey.id }}
          search={{ destination }}
          aria-label="Back to directions"
          className="flex h-10 w-10 items-center justify-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <FigmaIcon name="arrowBack" size={24} className="h-6 w-6" />
        </Link>
        <h1 className="flex-1 text-center text-xl font-medium text-ink">
          Live Direction
        </h1>
        <span className="h-10 w-10" aria-hidden="true" />
      </header>

      <section className="absolute inset-x-4 bottom-20 z-[1100] overflow-hidden rounded-[var(--radius-xs)] border border-charcoal-600 bg-canvas">
        <p className="flex items-center gap-3 bg-charcoal-500 px-5 py-3 text-sm font-semibold text-ink">
          <span aria-hidden="true">↗</span>
          Walk {journey.walkStartMinutes} minutes to
        </p>
        <div className="px-5 py-4">
          <div className="flex items-center gap-3">
            <RouteLineBadge route={journey.route} />
            <h2 className="text-lg font-medium text-ink">
              Pali Hwy + S Beretania St
            </h2>
          </div>
          <p className="mt-4 text-sm font-medium text-ink">300 m</p>
          <ol className="mt-2 space-y-2 pl-4 text-sm text-body">
            <li>Start from Bishop Street</li>
            <li>Turn left onto Adams Lane</li>
            <li>Turn right onto South Hotel Street</li>
          </ol>
        </div>
      </section>

      <div className="absolute inset-x-0 bottom-0 z-[1200] flex gap-3 border-t border-hairline bg-canvas px-5 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3">
        <Link
          to="/home"
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-pill)] bg-transit-blue px-6 text-base font-semibold text-on-primary"
        >
          End
        </Link>
        <Button
          variant="secondary"
          className="border-transit-blue text-transit-blue"
          onClick={() => setSaved((value) => !value)}
          aria-pressed={saved}
        >
          {saved ? "Saved" : "Favorite"}
        </Button>
      </div>
    </main>
  );
}
