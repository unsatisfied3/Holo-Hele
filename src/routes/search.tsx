import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { FigmaIcon } from "@/components/icons/FigmaIcon";
import { fetchStopSearch } from "@/lib/api/transit";
import { useFavoriteBusIds, useFavoriteStopIds } from "@/lib/favorites";
import { FAVORITE_BUS_PRESETS } from "@/lib/mock/favorites";
import { SEARCH_BUSES, SEARCH_PLACES } from "@/lib/mock/journeys";
import { HONOLULU_STOPS, getStopById } from "@/lib/thebus/stops";
import type { StopSearchResult } from "@/types/transit";

export const Route = createFileRoute("/search")({
  component: SearchPage,
});

function ResultIcon({
  type,
  neutral = false,
}: {
  type: "bus" | "stop" | "place";
  neutral?: boolean;
}) {
  const icon =
    type === "bus"
      ? "busRoute"
      : type === "stop"
        ? "busStopSign"
        : "placeFilled";
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
        neutral
          ? "bg-canvas-softer text-ink"
          : "bg-transit-blue-soft text-transit-blue"
      }`}
    >
      <FigmaIcon
        name={icon}
        size={16}
        className={`h-4 w-4 ${neutral ? "brightness-0" : "icon-brand-blue"}`}
      />
    </span>
  );
}

function SearchPage() {
  const navigate = useNavigate();
  const favoriteStopIds = useFavoriteStopIds();
  const favoriteBusIds = useFavoriteBusIds();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const favoriteStops = favoriteStopIds
    .map(getStopById)
    .filter((stop) => stop != null);
  const favoriteLinesByStop = useMemo(() => {
    const lines = new Map<string, string[]>();
    FAVORITE_BUS_PRESETS.forEach((bus) => {
      const stopLines = lines.get(bus.stopId) ?? [];
      if (!stopLines.includes(bus.route)) stopLines.push(bus.route);
      lines.set(bus.stopId, stopLines);
    });
    return lines;
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const officialStopsQuery = useQuery({
    queryKey: ["stop-search", debouncedQuery.toLocaleLowerCase()],
    queryFn: ({ signal }) => fetchStopSearch(debouncedQuery, signal),
    enabled: Boolean(debouncedQuery),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const matches = useMemo(() => {
    if (!normalizedQuery) {
      return { buses: SEARCH_BUSES, places: SEARCH_PLACES };
    }

    const includesQuery = (...values: string[]) =>
      values.some((value) =>
        value.toLocaleLowerCase().includes(normalizedQuery),
      );
    const matchesBusQuery = (...values: string[]) =>
      values.some((value) => {
        const normalizedValue = value.toLocaleLowerCase();
        return (
          normalizedValue.startsWith(normalizedQuery) ||
          normalizedValue
            .split(/\s+/)
            .some((word) => word.startsWith(normalizedQuery))
        );
      });

    return {
      buses: SEARCH_BUSES.filter((bus) =>
        matchesBusQuery(bus.route, bus.name, ...bus.searchTerms),
      ),
      places: SEARCH_PLACES.filter((place) =>
        includesQuery(place.name, place.address),
      ),
    };
  }, [normalizedQuery]);

  const previewStopMatches = useMemo<StopSearchResult[]>(
    () =>
      HONOLULU_STOPS.filter((stop) =>
        [stop.id, stop.name].some((value) =>
          value.toLocaleLowerCase().includes(normalizedQuery),
        ),
      ).map((stop) => ({ ...stop, lines: [] })),
    [normalizedQuery],
  );
  const stopMatches = (officialStopsQuery.data?.stops ?? previewStopMatches).slice(
    0,
    2,
  );
  const isStopSearchPending =
    Boolean(normalizedQuery) &&
    (debouncedQuery.toLocaleLowerCase() !== normalizedQuery ||
      officialStopsQuery.isPending);
  const hasAnyMatches =
    matches.buses.length > 0 ||
    stopMatches.length > 0 ||
    matches.places.length > 0;

  function planTrip(destination: string, place?: (typeof SEARCH_PLACES)[number]) {
    void navigate({
      to: "/plan",
      search: {
        destination,
        destinationDetail: place?.address,
        destinationLat: place?.lat,
        destinationLng: place?.lng,
      },
    });
  }

  function openBus(bus: (typeof SEARCH_BUSES)[number]) {
    if (bus.routePreviewId) {
      void navigate({
        to: "/routes/$routeId",
        params: { routeId: bus.routePreviewId },
      });
      return;
    }

    if (bus.busDetailId) {
      void navigate({
        to: "/buses/$busId",
        params: { busId: bus.busDetailId },
      });
    }
  }

  return (
    <main className="app-page-enter app-shell min-h-dvh overflow-y-auto bg-canvas">
      <header className="border-b-[7px] border-canvas-soft bg-canvas px-4 pb-4 pt-[max(env(safe-area-inset-top),4.25rem)]">
        <div className="flex h-12 items-center gap-2 rounded-[var(--radius-pill)] bg-canvas-softer px-4 transition-colors duration-150 focus-within:bg-canvas-muted">
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
            aria-autocomplete="list"
            autoFocus
            className="search-input min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-mute focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full opacity-65 transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              <FigmaIcon name="close" size={16} className="h-4 w-4" />
            </button>
          ) : null}
        </div>

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
                  <span className="block truncate text-sm text-mute">
                    {item.detail}
                  </span>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      </header>

      {normalizedQuery ? (
        <div
          className="search-content-reveal"
          aria-busy={isStopSearchPending}
        >
          <ResultSection title="Buses">
            {matches.buses.map((bus) => {
              const favoriteBusId =
                bus.busDetailId ??
                FAVORITE_BUS_PRESETS.find((favorite) => favorite.route === bus.route)?.id;
              const isFavorite = Boolean(
                favoriteBusId && favoriteBusIds.includes(favoriteBusId),
              );

              return (
                <button
                  key={bus.id}
                  type="button"
                  onClick={() => openBus(bus)}
                  className="flex w-full items-center gap-3 border-b border-hairline px-5 py-3 text-left transition-colors hover:bg-canvas-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
                >
                  <ResultIcon type="bus" neutral={!isFavorite} />
                  <span className="min-w-0 flex-1">
                    <strong className="block text-sm font-semibold text-ink">{bus.name}</strong>
                    <span className="block truncate text-sm text-mute">{bus.detail}</span>
                  </span>
                  {isFavorite ? (
                    <FigmaIcon
                      name="favorites"
                      size={24}
                      className="icon-brand-blue h-6 w-6 shrink-0"
                      alt={`Route ${bus.route} saved favorite`}
                    />
                  ) : null}
                </button>
              );
            })}
          </ResultSection>

          <ResultSection title="Stops">
            {stopMatches.map((stop) => (
              <Link
                key={stop.id}
                to="/stops/$id"
                params={{ id: stop.id }}
                className="flex items-center gap-3 border-b border-hairline px-5 py-3"
              >
                <ResultIcon type="stop" neutral />
                <span className="min-w-0">
                  <strong className="block text-sm font-semibold text-ink">{stop.name}</strong>
                  <span className="block text-sm text-mute">Stop {stop.id}</span>
                  {stop.lines.length ? (
                    <span className="block truncate text-sm text-mute">
                      Lines: {stop.lines.join(", ")}
                    </span>
                  ) : null}
                </span>
              </Link>
            ))}
            {isStopSearchPending ? (
              <p className="px-5 py-3 text-sm text-body" role="status">
                Searching official stops…
              </p>
            ) : officialStopsQuery.isError ? (
              <p className="px-5 py-3 text-sm text-body" role="status">
                Official stop search is unavailable. Preview matches are shown.
              </p>
            ) : null}
          </ResultSection>

          <ResultSection title="Places">
            {matches.places.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => planTrip(place.name, place)}
                className="flex w-full items-center gap-3 border-b border-hairline px-5 py-3 text-left"
              >
                <ResultIcon type="place" neutral />
                <span className="min-w-0">
                  <strong className="block text-sm font-semibold text-ink">{place.name}</strong>
                  <span className="block truncate text-sm text-mute">{place.address}</span>
                </span>
              </button>
            ))}
          </ResultSection>

          {!isStopSearchPending && !hasAnyMatches ? (
            <p className="px-5 py-8 text-center text-sm text-body" role="status">
              No buses, stops, or places match “{query.trim()}”.
            </p>
          ) : null}
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
                  className="flex items-center gap-4 border-b border-hairline px-5 py-2.5 transition-colors hover:bg-canvas-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
                >
                  <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-transit-blue-soft text-transit-blue">
                    <FigmaIcon name="busStopSign" size={16} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-sm font-bold text-ink">
                      {stop.name}
                    </strong>
                    <span className="block text-sm text-mute">Stop {stop.id}</span>
                    {favoriteLinesByStop.get(stop.id)?.length ? (
                      <span className="block truncate text-sm text-mute">
                        Lines: {favoriteLinesByStop.get(stop.id)?.join(", ")}
                      </span>
                    ) : null}
                  </span>
                  <FigmaIcon
                    name="favorites"
                    size={27}
                    className="icon-brand-blue h-[27px] w-[27px]"
                  />
                </Link>
              ))
            ) : (
              <p className="px-5 py-4 text-sm text-body">
                Saved stops will appear here.
              </p>
            )}
          </ResultSection>

          <ResultSection title="Recent">
            {SEARCH_BUSES.slice(0, 2).map((bus) => (
              <button
                key={bus.id}
                type="button"
                onClick={() => openBus(bus)}
                className="flex w-full items-center gap-4 border-b border-hairline px-5 py-2.5 text-left transition-colors hover:bg-canvas-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
              >
                <ResultIcon type="bus" neutral />
                <span className="min-w-0">
                  <strong className="block text-sm font-semibold text-ink">{bus.name}</strong>
                  <span className="block truncate text-sm text-mute">{bus.detail}</span>
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
