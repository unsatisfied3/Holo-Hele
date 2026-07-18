import { ArrivalTimeDisplay } from "@/components/transit/ArrivalTimeDisplay";
import { RouteLineBadge } from "@/components/icons/FigmaIcon";
import type { StopLocation, TheBusArrival } from "@/types/transit";

interface TrackingSummaryProps {
  stop: StopLocation;
  arrival: TheBusArrival;
  stopsAway: number | null;
}

function travelTimeLabel(arrival: TheBusArrival): string | null {
  if (arrival.minutesUntil == null) return null;
  if (arrival.minutesUntil === 0) return "Arriving now";
  return `Travel Time: ${arrival.minutesUntil} min`;
}

function stopsAwayLabel(stopsAway: number | null): string | null {
  if (stopsAway == null) return null;
  if (stopsAway === 0) return "Arriving at your stop";
  if (stopsAway === 1) return "1 stop away";
  return `${stopsAway} stops away`;
}

export function TrackingSummary({ stop, arrival, stopsAway }: TrackingSummaryProps) {
  const travelTime = travelTimeLabel(arrival);
  const stopsAwayText = stopsAwayLabel(stopsAway);

  return (
    <section className="tracking-summary pointer-events-none absolute inset-x-0 bottom-0 z-[500] pb-[max(env(safe-area-inset-bottom),1rem)]">
      <div className="pointer-events-auto w-full">
        {stopsAwayText ? (
          <p className="mb-2 rounded-[var(--radius-xs)] border border-hairline bg-canvas px-4 py-2.5 text-center text-sm font-medium text-ink">
            {stopsAwayText}
          </p>
        ) : null}

        <article className="rounded-[var(--radius-xs)] border border-hairline bg-canvas px-4 py-4">
          {travelTime ? (
            <p className="text-xs font-medium text-body">{travelTime}</p>
          ) : null}

          <div className={`flex items-start gap-3 ${travelTime ? "mt-3" : ""}`}>
            <RouteLineBadge route={arrival.route} />

            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-medium leading-snug text-ink">{arrival.headsign}</h2>
              <p className="mt-1 truncate text-xs text-body">{stop.name}</p>
            </div>

            <ArrivalTimeDisplay arrival={arrival} colorNearLive />
          </div>

          {!arrival.estimated ? (
            <p className="mt-3 text-xs text-body">
              Live vehicle location is unavailable for scheduled trips.
            </p>
          ) : null}
        </article>

        <div
          className="mt-3 flex items-center justify-center gap-1.5"
          aria-hidden="true"
        >
          <span className="h-2 w-2 rounded-full bg-ink" />
          <span className="h-2 w-2 rounded-full bg-charcoal-500" />
          <span className="h-2 w-2 rounded-full bg-charcoal-500" />
          <span className="h-2 w-2 rounded-full bg-charcoal-500" />
        </div>
      </div>
    </section>
  );
}
