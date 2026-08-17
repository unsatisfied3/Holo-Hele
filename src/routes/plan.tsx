import { createFileRoute, Link } from "@tanstack/react-router";

import {
  FigmaIcon,
  LiveSignalIcon,
  RouteLineBadge,
  ScheduleIcon,
} from "@/components/icons/FigmaIcon";
import { JOURNEY_OPTIONS, type JourneyOption } from "@/lib/mock/journeys";

interface PlanSearch {
  destination: string;
}

export const Route = createFileRoute("/plan")({
  validateSearch: (search): PlanSearch => ({
    destination:
      typeof search.destination === "string" && search.destination.trim()
        ? search.destination
        : "Ala Moana Center",
  }),
  component: PlanTripPage,
});

function JourneyCard({
  journey,
  destination,
}: {
  journey: JourneyOption;
  destination: string;
}) {
  return (
    <Link
      to="/directions/$journeyId"
      params={{ journeyId: journey.id }}
      search={{ destination }}
      className="block rounded-[var(--radius-md)] border border-hairline bg-canvas px-5 py-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <p className="text-sm text-mute">
        Travel Time:{" "}
        <strong className="font-semibold text-ink">{journey.travelMinutes} min</strong>
      </p>
      <div className="mt-3 flex items-center gap-3">
        <span className="text-xs font-semibold text-ink">
          Walk {journey.walkStartMinutes}
        </span>
        <span aria-hidden="true">›</span>
        <RouteLineBadge route={journey.route} />
        {journey.walkEndMinutes ? (
          <>
            <span aria-hidden="true">›</span>
            <span className="text-xs font-semibold text-ink">
              Walk {journey.walkEndMinutes}
            </span>
          </>
        ) : null}
        <span className="ml-auto flex items-center gap-1 text-base font-semibold text-ink">
          {journey.etaMinutes != null ? (
            <>
              <LiveSignalIcon className="h-3 w-3 text-live" />
              <span className="text-live">{journey.etaMinutes} min</span>
            </>
          ) : (
            <>
              <ScheduleIcon className="h-4 w-4" />
              {journey.scheduledTime}
            </>
          )}
        </span>
      </div>
    </Link>
  );
}

function PlanTripPage() {
  const { destination } = Route.useSearch();
  const recommended = JOURNEY_OPTIONS[0];
  const alternatives = JOURNEY_OPTIONS.slice(1);

  return (
    <main className="app-shell min-h-dvh overflow-y-auto bg-canvas-soft">
      <header className="border-b border-hairline bg-canvas px-4 pb-5 pt-[max(env(safe-area-inset-top),1rem)]">
        <div className="flex min-h-12 items-center">
          <Link
            to="/search"
            aria-label="Back to search"
            className="flex h-10 w-10 items-center justify-start rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <FigmaIcon name="arrowBack" size={24} className="h-6 w-6" />
          </Link>
          <h1 className="flex-1 text-center text-xl font-semibold text-ink">
            Plan Trip
          </h1>
          <span className="h-10 w-10" aria-hidden="true" />
        </div>

        <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-2">
          <div className="space-y-2">
            <div className="flex min-h-12 items-center gap-3 rounded-[var(--radius-pill)] border border-hairline px-4">
              <span className="h-3 w-3 rounded-full border-2 border-ink" />
              <span className="text-sm text-body">Current Location</span>
            </div>
            <div className="flex min-h-12 items-center gap-3 rounded-[var(--radius-pill)] border border-hairline px-4">
              <FigmaIcon name="place" size={16} className="h-4 w-4" />
              <span className="truncate text-sm text-body">{destination}</span>
            </div>
          </div>
          <button
            type="button"
            aria-label="Swap origin and destination"
            className="flex h-11 w-11 items-center justify-center rounded-full text-2xl text-body focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            ⇅
          </button>
        </div>
      </header>

      <div className="flex items-center gap-3 border-b border-hairline bg-canvas px-5 py-2">
        <span className="text-2xl" aria-hidden="true">⟳</span>
        <button type="button" className="min-h-10 rounded-[var(--radius-md)] bg-canvas-softer px-4 text-sm font-semibold text-ink">
          Depart now⌄
        </button>
        <button type="button" className="min-h-10 rounded-[var(--radius-md)] bg-canvas-softer px-4 text-sm font-semibold text-ink">
          Filter by⌄
        </button>
      </div>

      <p className="px-4 pt-3 text-xs text-body">
        Preview routes — trip planning data is currently simulated.
      </p>

      <section className="px-4 py-3">
        <h2 className="mb-2 text-base font-semibold text-ink">
          Recommended Route
        </h2>
        <JourneyCard journey={recommended} destination={destination} />
      </section>

      <section className="px-4 pb-5">
        <h2 className="mb-2 text-base font-semibold text-ink">Other Routes</h2>
        <div className="space-y-2">
          {alternatives.map((journey) => (
            <JourneyCard
              key={journey.id}
              journey={journey}
              destination={destination}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
