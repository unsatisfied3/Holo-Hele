import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import {
  DirectionsMap,
  type DirectionsMapPhase,
} from "@/components/directions/DirectionsMap";
import { FigmaIcon, RouteLineBadge } from "@/components/icons/FigmaIcon";
import { Button } from "@/components/ui/Button";
import {
  parseTripRouteSearch,
  resolvePlannedJourney,
  type TripRouteSearch,
} from "@/lib/trip-planning";

export const Route = createFileRoute("/live-directions/$journeyId")({
  validateSearch: (search): TripRouteSearch => parseTripRouteSearch(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ params, deps }) => {
    const journey = await resolvePlannedJourney(params.journeyId, deps);
    if (!journey) throw notFound();
    return journey;
  },
  component: LiveDirectionsPage,
});

function minuteLabel(minutes: number) {
  return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
}

function LiveDirectionsPage() {
  const journey = Route.useLoaderData();
  const search = Route.useSearch();
  const [saved, setSaved] = useState(false);
  const [phase, setPhase] = useState<Exclude<DirectionsMapPhase, "preview">>("walking");
  const isWalking = phase === "walking";

  return (
    <main className="app-shell relative h-dvh overflow-hidden bg-canvas">
      <div className="absolute inset-0">
        <DirectionsMap journey={journey} phase={phase} showControls={false} />
      </div>

      <header className="absolute inset-x-0 top-0 z-[1200] flex min-h-16 items-center border-b border-hairline bg-canvas px-3 pt-[env(safe-area-inset-top)]">
        <Link
          to="/directions/$journeyId"
          params={{ journeyId: journey.id }}
          search={search}
          aria-label="Back to directions"
          className="flex h-10 w-10 items-center justify-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <FigmaIcon name="arrowBack" size={24} className="h-6 w-6" />
        </Link>
        <h1 className="flex-1 text-center text-base font-medium text-ink">
          Live Direction
        </h1>
        <span className="h-10 w-10" aria-hidden="true" />
      </header>

      <section
        aria-live="polite"
        className="absolute inset-x-3 bottom-[5.75rem] z-[1100] overflow-hidden rounded-[2px] border border-charcoal-600 bg-canvas"
      >
        <div className="flex min-h-[43px] items-center gap-3 bg-charcoal-400 px-6 py-2.5">
          <FigmaIcon name="walking" size={20} className="h-5 w-[14px]" />
          <h2 className="text-xs font-medium text-ink">
            {isWalking ? (
              <>
                Walk <strong>{minuteLabel(journey.walkStartMinutes)}</strong> to
              </>
            ) : (
              <>
                Get off in <strong>{journey.rideStops} stops</strong>
              </>
            )}
          </h2>
        </div>

        <div className="px-5 py-3.5">
          {journey.dataSource === "mock" ? (
            <p className="mb-2 text-[11px] font-medium text-body">
              Simulated guidance
            </p>
          ) : null}
          <div className="flex items-center gap-3">
            <RouteLineBadge route={journey.route} />
            <p className="min-w-0 truncate text-sm font-medium text-ink">
              {isWalking ? journey.boardStop.name : journey.alightStop.name}
            </p>
          </div>
          <p className="mt-2 text-xs font-medium text-ink">
            {isWalking ? journey.walkStartDistance : `${journey.rideStops} stops remaining`}
          </p>
          {isWalking ? (
            <ol className="mt-1.5 space-y-1 pl-3 text-xs leading-[1.55] text-body">
              {journey.walkingInstructions.map((instruction) => (
                <li key={instruction}>{instruction}</li>
              ))}
            </ol>
          ) : (
            <ol className="mt-1.5 space-y-1 pl-3 text-xs leading-[1.55] text-body">
              <li>Stay on Line {journey.route} toward {journey.routeHeadsign}.</li>
              <li>Next stop: {journey.nextTransitStop}.</li>
              <li>Get off at Stop {journey.alightStop.id}.</li>
            </ol>
          )}
        </div>
      </section>

      <nav
        aria-label="Live direction steps"
        className="absolute inset-x-0 bottom-[4.05rem] z-[1150] flex h-7 items-center justify-center gap-0"
      >
        <button
          type="button"
          aria-label="Show walking guidance"
          aria-current={isWalking ? "step" : undefined}
          onClick={() => setPhase("walking")}
          className="flex h-11 w-8 items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <span className={`h-2 w-2 rounded-full ${isWalking ? "bg-charcoal-700" : "border border-charcoal-700 bg-canvas"}`} />
        </button>
        <button
          type="button"
          aria-label="I’m on the bus — show onboard guidance"
          aria-current={!isWalking ? "step" : undefined}
          onClick={() => setPhase("transit")}
          className="flex h-11 w-8 items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <span className={`h-2 w-2 rounded-full ${!isWalking ? "bg-charcoal-700" : "border border-charcoal-700 bg-canvas"}`} />
        </button>
        <span className="flex h-11 w-8 items-center justify-center" aria-hidden="true">
          <span className="h-2 w-2 rounded-full border border-charcoal-700 bg-canvas" />
        </span>
      </nav>

      <div className="absolute inset-x-0 bottom-0 z-[1200] flex min-h-16 gap-2 border-t border-hairline bg-canvas px-5 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3">
        <Link
          to="/home"
          className="inline-flex min-h-9 items-center justify-center rounded-[var(--radius-pill)] bg-transit-blue px-5 text-sm font-bold text-on-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          End
        </Link>
        <Button
          variant="secondary"
          className="min-h-9 rounded-[var(--radius-pill)] border-transit-blue px-5 text-sm text-transit-blue"
          onClick={() => setSaved((value) => !value)}
          aria-pressed={saved}
        >
          {saved ? "Saved" : "Favorite"}
        </Button>
      </div>
    </main>
  );
}
