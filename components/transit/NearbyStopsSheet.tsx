"use client";

import { Link } from "@tanstack/react-router";

import type { NearbyStopResult } from "@/types/transit";
import { FigmaIcon } from "@/components/icons/FigmaIcon";
import { RouteArrivalRow } from "@/components/transit/RouteArrivalRow";
import { StopListItem } from "@/components/transit/StopListItem";
import { cn } from "@/lib/utils";

interface NearbyStopsSheetProps {
  stops: NearbyStopResult[];
  loading?: boolean;
  error?: string | null;
  fetchedAt?: string;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

/** Max route preview rows shown under each stop (Figma: indented rows below stop header). */
const PREVIEW_ARRIVALS_PER_STOP = 3;

function buildHomeListItems(stops: NearbyStopResult[]) {
  if (stops.length === 0) return [];

  const items: Array<
    | { type: "stop"; stopResult: NearbyStopResult }
    | { type: "arrival"; stopId: string; arrival: NearbyStopResult["arrivals"][number] }
  > = [];

  for (const stopResult of stops) {
    items.push({ type: "stop", stopResult });

    for (const arrival of stopResult.arrivals.slice(0, PREVIEW_ARRIVALS_PER_STOP)) {
      items.push({ type: "arrival", stopId: stopResult.stop.id, arrival });
    }
  }

  return items;
}

export function NearbyStopsSheet({
  stops,
  loading = false,
  error = null,
  fetchedAt,
  expanded,
  onExpandedChange,
}: NearbyStopsSheetProps) {
  const listItems = buildHomeListItems(stops);

  return (
    <section
      aria-label="Nearby stops"
      className={cn(
        "home-screen__sheet pointer-events-auto flex flex-col border-t border-hairline bg-canvas",
        expanded ? "home-screen__sheet--expanded" : "home-screen__sheet--collapsed",
      )}
    >
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => onExpandedChange(!expanded)}
        className="flex w-full items-center justify-center gap-2 border-b border-hairline px-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span className="text-base font-semibold text-ink">Nearby Stops</span>
        <FigmaIcon
          name="chevronDown"
          size={16}
          className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")}
        />
      </button>

      {expanded ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <p className="py-6 text-center text-sm text-body">Loading nearby stops…</p>
          ) : error ? (
            <p className="px-4 py-6 text-center text-sm text-body">{error}</p>
          ) : listItems.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-body">
              No nearby stops found for this area.
            </p>
          ) : (
            <ul className="divide-y divide-hairline">
              {listItems.map((item) =>
                item.type === "stop" ? (
                  <li key={`stop-${item.stopResult.stop.id}`}>
                    <StopListItem stopResult={item.stopResult} />
                  </li>
                ) : (
                  <li key={`arrival-${item.stopId}-${item.arrival.id}`}>
                    <Link
                      to="/stops/$id/track/$arrivalId"
                      params={{ id: item.stopId, arrivalId: item.arrival.id }}
                      aria-label={`Track Route ${item.arrival.route} to ${item.arrival.headsign}`}
                      className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
                    >
                      <RouteArrivalRow arrival={item.arrival} />
                    </Link>
                  </li>
                ),
              )}
            </ul>
          )}

          {fetchedAt ? (
            <p className="px-4 pb-4 pt-2 text-xs text-mute">
              Updated {new Date(fetchedAt).toLocaleTimeString()}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
