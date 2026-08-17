import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { FigmaIcon } from "@/components/icons/FigmaIcon";
import { useFavoriteStopIds } from "@/lib/favorites";
import { SEARCH_BUSES, SEARCH_PLACES } from "@/lib/mock/journeys";
import { HONOLULU_STOPS, getStopById } from "@/lib/thebus/stops";

export const Route = createFileRoute("/search")({
  component: SearchPage,
});

function ResultIcon({ type }: { type: "bus" | "stop" | "place" }) {
  const icon =
    type === "bus" ? "busRoute" : type === "stop" ? "busStopSign" : "place";
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-transit-blue-soft text-transit-blue">
      <FigmaIcon name={icon} size={16} className="h-4 w-4" />
    </span>
  );
}

function SearchPage() {
  const navigate = useNavigate();
  const favoriteStopIds = useFavoriteStopIds();
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const favoriteStops = favoriteStopIds
    .map(getStopById)
    .filter((stop) => stop != null);

  const matches = useMemo(() => {
    if (!normalizedQuery) {
      return { buses: SEARCH_BUSES, stops: HONOLULU_STOPS, places: SEARCH_PLACES };
    }

    const includesQuery = (...values: string[]) =>
      values.some((value) =>
        value.toLocaleLowerCase().includes(normalizedQuery),
      );

    return {
      buses: SEARCH_BUSES.filter((bus) =>
        includesQuery(bus.route, bus.name, bus.detail),
      ),
      stops: HONOLULU_STOPS.filter((stop) =>
        includesQuery(stop.id, stop.name),
      ),
      places: SEARCH_PLACES.filter((place) =>
        includesQuery(place.name, place.address),
      ),
    };
  }, [normalizedQuery]);

  function planTrip(destination: string) {
    void navigate({ to: "/plan", search: { destination } });
  }

  return (
    <main className="app-page-enter app-shell min-h-dvh overflow-y-auto bg-canvas">
      <header className="border-b-[7px] border-canvas-soft bg-canvas px-4 pb-4 pt-[max(env(safe-area-inset-top),4.25rem)]">
        <label className="flex h-12 items-center gap-2 rounded-[var(--radius-pill)] bg-canvas-softer px-4 transition-colors duration-150 focus-within:bg-canvas-muted">
          <Link
            to="/home"
            aria-label="Back to map"
            className="flex h-9 w-7 shrink-0 items-center justify-start rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <FigmaIcon name="arrowBack" size={22} className="h-[22px] w-[22px]" />
          </Link>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Where to?"
            aria-label="Search buses, stops, and places"
            autoFocus
            className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-mute focus:outline-none"
          />
        </label>

        <div className="mt-3 flex items-center gap-5">
          {[
            { label: "Home", detail: "2154 Queens…", icon: "home" as const },
            { label: "Work", detail: "2154 Queens…", icon: "work" as const },
            { label: "Other", detail: "", icon: "other" as const },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => planTrip(item.label)}
              className="flex min-h-10 min-w-0 items-center gap-2 rounded-[var(--radius-md)] text-left transition-[transform,background-color] duration-150 ease-out hover:bg-canvas-muted active:scale-[0.97] motion-reduce:transform-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-canvas-softer">
                <FigmaIcon name={item.icon} size={16} className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink">{item.label}</span>
                {item.detail ? (
                  <span className="block truncate text-[11px] text-mute">
                    {item.detail}
                  </span>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      </header>

      {normalizedQuery ? (
        <div className="search-content-reveal">
          <ResultSection title="Buses">
            {matches.buses.map((bus) => (
              <button
                key={bus.id}
                type="button"
                onClick={() => {
                  if (bus.routePreviewId) {
                    void navigate({
                      to: "/routes/$routeId",
                      params: { routeId: bus.routePreviewId },
                    });
                    return;
                  }

                  planTrip(bus.name);
                }}
                className="flex w-full items-center gap-3 border-b border-hairline px-5 py-3 text-left transition-colors hover:bg-canvas-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
              >
                <ResultIcon type="bus" />
                <span className="min-w-0">
                  <strong className="block text-sm font-semibold text-ink">{bus.name}</strong>
                  <span className="block truncate text-sm text-mute">{bus.detail}</span>
                </span>
              </button>
            ))}
          </ResultSection>

          <ResultSection title="Stops">
            {matches.stops.map((stop) => (
              <Link
                key={stop.id}
                to="/stops/$id"
                params={{ id: stop.id }}
                className="flex items-center gap-3 border-b border-hairline px-5 py-3"
              >
                <ResultIcon type="stop" />
                <span className="min-w-0">
                  <strong className="block text-sm font-semibold text-ink">{stop.name}</strong>
                  <span className="block text-sm text-mute">Stop {stop.id}</span>
                </span>
              </Link>
            ))}
          </ResultSection>

          <ResultSection title="Places">
            {matches.places.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => planTrip(place.name)}
                className="flex w-full items-center gap-3 border-b border-hairline px-5 py-3 text-left"
              >
                <ResultIcon type="place" />
                <span className="min-w-0">
                  <strong className="block text-sm font-semibold text-ink">{place.name}</strong>
                  <span className="block truncate text-sm text-mute">{place.address}</span>
                </span>
              </button>
            ))}
          </ResultSection>
        </div>
      ) : (
        <div className="search-content-reveal">
          <ResultSection title="Favorites">
            {favoriteStops.length ? (
              favoriteStops.map((stop) => (
                <Link
                  key={stop.id}
                  to="/stops/$id"
                  params={{ id: stop.id }}
                  className="flex items-center gap-3 border-b border-hairline px-5 py-3"
                >
                  <ResultIcon type="stop" />
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-sm font-semibold text-ink">
                      {stop.name}
                    </strong>
                    <span className="block text-sm text-mute">Stop {stop.id}</span>
                  </span>
                  <FigmaIcon name="favorite" size={20} className="h-5 w-5" />
                </Link>
              ))
            ) : (
              <p className="px-5 py-4 text-sm text-body">
                Saved stops will appear here.
              </p>
            )}
          </ResultSection>

          <ResultSection title="Recent">
            {SEARCH_PLACES.slice(0, 3).map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => planTrip(place.name)}
                className="flex w-full items-center gap-3 border-b border-hairline px-5 py-3 text-left"
              >
                <ResultIcon type="place" />
                <span className="min-w-0">
                  <strong className="block text-sm font-semibold text-ink">{place.name}</strong>
                  <span className="block truncate text-sm text-mute">{place.address}</span>
                </span>
              </button>
            ))}
          </ResultSection>
        </div>
      )}
    </main>
  );
}

function ResultSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b-[7px] border-canvas-soft bg-canvas">
      <h2 className="px-5 pb-2 pt-4 text-sm font-medium text-ink">{title}</h2>
      {children}
    </section>
  );
}
