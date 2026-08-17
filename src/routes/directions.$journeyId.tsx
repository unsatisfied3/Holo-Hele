import { useState } from "react";
import {
  createFileRoute,
  Link,
  notFound,
  useNavigate,
} from "@tanstack/react-router";

import { DirectionsMap } from "@/components/directions/DirectionsMap";
import {
  FigmaIcon,
  LiveSignalIcon,
  RouteLineBadge,
} from "@/components/icons/FigmaIcon";
import { Button } from "@/components/ui/Button";
import { JOURNEY_OPTIONS } from "@/lib/mock/journeys";

interface DirectionsSearch {
  destination: string;
}

export const Route = createFileRoute("/directions/$journeyId")({
  validateSearch: (search): DirectionsSearch => ({
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
  component: DirectionsPage,
});

function TimelineDot({ final = false }: { final?: boolean }) {
  return (
    <span
      className={
        final
          ? "mt-0.5 h-4 w-4 rounded-full bg-ink"
          : "mt-1 h-2.5 w-2.5 rounded-full bg-charcoal-500"
      }
      aria-hidden="true"
    />
  );
}

function DirectionsPage() {
  const navigate = useNavigate();
  const journey = Route.useLoaderData();
  const { destination } = Route.useSearch();
  const [saved, setSaved] = useState(false);

  return (
    <main className="app-shell relative h-dvh overflow-hidden bg-canvas">
      <header className="absolute inset-x-0 top-0 z-[1200] flex min-h-14 items-center border-b border-hairline bg-canvas px-3 pt-[env(safe-area-inset-top)]">
        <Link
          to="/plan"
          search={{ destination }}
          aria-label="Back to route options"
          className="flex h-10 w-10 items-center justify-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <FigmaIcon name="arrowBack" size={22} className="h-[22px] w-[22px]" />
        </Link>
        <h1 className="flex-1 text-center text-base font-medium text-ink">
          Direction
        </h1>
        <span className="h-10 w-10" aria-hidden="true" />
      </header>

      <div className="absolute inset-x-0 top-14 h-[43dvh]">
        <DirectionsMap />
      </div>

      <section className="absolute inset-x-0 bottom-0 z-[1100] flex max-h-[57dvh] flex-col rounded-t-[var(--radius-xl)] border-t border-hairline bg-canvas">
        <div className="flex justify-center py-2" aria-hidden="true">
          <span className="h-1 w-7 rounded-full bg-charcoal-700" />
        </div>
        <div className="border-b border-hairline px-4 pb-4">
          <div className="flex items-center gap-3">
            <p className="text-xs text-body">
              Travel Time:{" "}
              <strong className="font-semibold text-ink">
                {journey.travelMinutes} min
              </strong>
            </p>
            <span className="ml-auto flex items-center gap-1 text-sm font-semibold text-live">
              <LiveSignalIcon className="h-3 w-3" />
              {journey.etaMinutes ?? 8} min
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-xs font-semibold text-ink">
              Walk {journey.walkStartMinutes}
            </span>
            <span aria-hidden="true">›</span>
            <RouteLineBadge route={journey.route} />
          </div>
        </div>

        <ol className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <li className="grid grid-cols-[18px_1fr_auto] gap-x-3 border-b border-hairline py-2">
            <TimelineDot final />
            <strong className="text-sm text-ink">Your location</strong>
            <time className="text-xs text-ink">8:06 AM</time>
          </li>
          <li className="grid grid-cols-[18px_1fr] gap-x-3 border-b border-hairline py-3">
            <TimelineDot />
            <div>
              <strong className="text-sm text-ink">Walk 3 min (250m)</strong>
              <p className="mt-1 text-xs text-body">Continue toward S King Street.</p>
            </div>
          </li>
          <li className="grid grid-cols-[18px_1fr_auto] gap-x-3 border-b border-hairline py-3">
            <TimelineDot final />
            <div>
              <strong className="text-sm text-ink">S King St + Alakea St</strong>
              <p className="mt-1 flex items-center gap-1 text-xs text-body">
                <FigmaIcon name="busRoute" size={13} className="h-[13px] w-[13px]" />
                Route {journey.route} · U.H. Manoa
              </p>
            </div>
            <time className="text-sm font-semibold text-ink">8:09 AM</time>
          </li>
          <li className="grid grid-cols-[18px_1fr] gap-x-3 border-b border-hairline py-3">
            <TimelineDot />
            <strong className="text-xs text-ink">Ride 10 stops (15 min)</strong>
          </li>
          <li className="grid grid-cols-[18px_1fr_auto] gap-x-3 border-b border-hairline py-3">
            <TimelineDot />
            <strong className="text-sm text-ink">Sinclair Circle</strong>
            <time className="text-xs text-ink">8:24 AM</time>
          </li>
          <li className="grid grid-cols-[18px_1fr] gap-x-3 py-3">
            <TimelineDot final />
            <div>
              <strong className="text-sm text-ink">{destination}</strong>
              <p className="mt-1 text-xs text-body">
                Preview destination · confirm details before travel.
              </p>
            </div>
          </li>
        </ol>

        <div className="flex gap-2 border-t border-hairline px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3">
          <Button
            className="min-h-10 px-5 text-sm"
            onClick={() =>
              void navigate({
                to: "/live-directions/$journeyId",
                params: { journeyId: journey.id },
                search: { destination },
              })
            }
          >
            Start
          </Button>
          <Button
            variant="secondary"
            className="min-h-10 px-5 text-sm"
            onClick={() => setSaved((value) => !value)}
            aria-pressed={saved}
          >
            {saved ? "Saved" : "Favorite"}
          </Button>
        </div>
      </section>
    </main>
  );
}
