import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import {
  AlertTriangleIcon,
  FigmaIcon,
} from "@/components/icons/FigmaIcon";
import { AppShell } from "@/components/layout/AppShell";
import {
  removeFavoriteBus,
  removeFavoriteStop,
  useFavoriteBusIds,
  useFavoriteStopIds,
} from "@/lib/favorites";
import {
  FAVORITE_BUS_PRESETS,
  type FavoriteBusDefinition,
} from "@/lib/mock/favorites";
import { getServiceAlertForBus } from "@/lib/mock/service-alerts";
import { getStopById } from "@/lib/thebus/stops";
import { cn } from "@/lib/utils";
import type { StopLocation } from "@/types/transit";

type FavoriteTab = "buses" | "stops";

interface FavoritesSearch {
  tab?: FavoriteTab;
}

export const Route = createFileRoute("/favorites")({
  validateSearch: (search: Record<string, unknown>): FavoritesSearch => ({
    tab: search.tab === "stops" || search.tab === "buses" ? search.tab : undefined,
  }),
  component: FavoritesPage,
});

function FavoriteButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-brand-blue transition-colors hover:bg-brand-blue-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
    >
      <FigmaIcon
        name="favorites"
        size={20}
        className="icon-brand-blue h-5 w-5"
      />
    </button>
  );
}

function FavoritesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const activeTab = search.tab ?? "buses";
  const [query, setQuery] = useState("");
  const favoriteStopIds = useFavoriteStopIds();
  const favoriteBusIds = useFavoriteBusIds();
  const normalizedQuery = query.trim().toLocaleLowerCase();

  const favoriteStops = favoriteStopIds
    .map(getStopById)
    .filter((stop): stop is StopLocation => stop != null);
  const favoriteBuses = FAVORITE_BUS_PRESETS.filter((bus) =>
    favoriteBusIds.includes(bus.id),
  );
  const visibleStops = favoriteStops.filter(
    (stop) =>
      !normalizedQuery ||
      stop.name.toLocaleLowerCase().includes(normalizedQuery) ||
      stop.id.includes(normalizedQuery),
  );
  const visibleBuses = favoriteBuses.filter(
    (bus) =>
      !normalizedQuery ||
      bus.route.toLocaleLowerCase().includes(normalizedQuery) ||
      bus.headsign.toLocaleLowerCase().includes(normalizedQuery) ||
      bus.stopName.toLocaleLowerCase().includes(normalizedQuery),
  );
  const items = activeTab === "buses" ? visibleBuses : visibleStops;
  const allItems = activeTab === "buses" ? favoriteBuses : favoriteStops;

  return (
    <AppShell>
      <main className="flex h-full min-h-0 flex-col bg-canvas">
        <header className="border-b-[6px] border-canvas-soft bg-canvas px-4 pb-5 pt-[max(env(safe-area-inset-top),3rem)]">
          <h1 className="text-center text-lg font-medium text-ink">Favorites</h1>
          <label className="mt-7 flex h-12 items-center gap-2.5 rounded-[var(--radius-pill)] border border-hairline bg-canvas-softer px-4">
            <FigmaIcon name="search" size={22} className="h-[22px] w-[22px] shrink-0" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              aria-label="Search favorites"
              className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-mute focus:outline-none"
            />
          </label>
        </header>

        <div
          role="tablist"
          aria-label="Favorite type"
          className="grid grid-cols-2 border-b border-hairline bg-canvas py-1.5"
        >
          {(["buses", "stops"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => {
                void navigate({ search: { tab }, replace: true });
                setQuery("");
              }}
              className={cn(
                "mx-2.5 min-h-[34px] rounded-[6px] text-sm font-medium capitalize transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue",
                activeTab === tab
                  ? "bg-brand-blue-subtle text-brand-blue"
                  : "text-body hover:bg-canvas-softer",
              )}
            >
              {tab === "buses" ? "Buses" : "Stops"}
            </button>
          ))}
        </div>

        {allItems.length === 0 ? (
          <EmptyFavorites activeTab={activeTab} />
        ) : items.length === 0 ? (
          <section className="flex flex-1 items-center justify-center px-8 pb-12 text-center">
            <div>
              <h2 className="text-base font-semibold text-ink">
                No matching {activeTab}
              </h2>
              <p className="mt-2 text-sm text-body">
                Try a route, destination, stop name, or stop number.
              </p>
            </div>
          </section>
        ) : activeTab === "buses" ? (
          <FavoriteBusList buses={visibleBuses} />
        ) : (
          <FavoriteStopList stops={visibleStops} />
        )}
      </main>
    </AppShell>
  );
}

function FavoriteBusList({ buses }: { buses: FavoriteBusDefinition[] }) {
  return (
    <section aria-label="Favorite buses" className="min-h-0 flex-1 overflow-y-auto">
      <ul className="px-4">
        {buses.map((bus) => {
          const serviceAlert = getServiceAlertForBus(bus.id);

          return (
          <li key={bus.id} className="flex min-h-[64px] items-center gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blue-subtle">
              <FigmaIcon
                name="busRoute"
                size={14}
                className="icon-brand-blue h-3.5 w-3.5"
              />
            </div>
            <div className="flex min-w-0 flex-1 items-center border-b border-hairline">
              <Link
                to="/buses/$busId"
                params={{ busId: bus.id }}
                className="min-w-0 flex-1 rounded-[var(--radius-xs)] py-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
              >
                <p className="text-sm font-normal leading-snug text-ink">
                  {bus.route} - {bus.headsign}
                </p>
                <p className="mt-0.5 truncate text-xs text-body">{bus.stopName}</p>
                {serviceAlert ? (
                  <p className="mt-1 inline-flex items-center gap-1 rounded-[var(--radius-xs)] bg-alert-subtle px-1.5 py-1 text-xs font-medium text-alert">
                    <AlertTriangleIcon className="h-3.5 w-3.5 shrink-0" />
                    <span>{serviceAlert.title}</span>
                  </p>
                ) : null}
              </Link>
              <FavoriteButton
                label={`Remove Route ${bus.route} from favorites`}
                onClick={() => removeFavoriteBus(bus.id)}
              />
            </div>
          </li>
          );
        })}
      </ul>
    </section>
  );
}

function FavoriteStopList({ stops }: { stops: StopLocation[] }) {
  return (
    <section aria-label="Favorite stops" className="min-h-0 flex-1 overflow-y-auto">
      <ul className="px-4">
        {stops.map((stop) => (
          <li key={stop.id} className="flex min-h-[56px] items-center gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blue-subtle">
              <FigmaIcon
                name="busStopSign"
                size={14}
                className="icon-brand-blue h-3.5 w-3.5"
              />
            </div>
            <div className="flex min-w-0 flex-1 items-center border-b border-hairline">
              <Link
                to="/stops/$id"
                params={{ id: stop.id }}
                search={{ from: "favorites" }}
                className="min-w-0 flex-1 rounded-[var(--radius-xs)] py-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
              >
                <p className="truncate text-sm font-normal leading-snug text-ink">{stop.name}</p>
              </Link>
              <FavoriteButton
                label={`Remove ${stop.name} from favorites`}
                onClick={() => removeFavoriteStop(stop.id)}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function EmptyFavorites({ activeTab }: { activeTab: FavoriteTab }) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-8 pb-12 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-canvas-softer">
        <FigmaIcon
          name={activeTab === "buses" ? "busRoute" : "busStopSign"}
          size={20}
          className="h-5 w-5"
        />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-ink">
        No favorite {activeTab} yet
      </h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-body">
        Save {activeTab === "buses" ? "a bus from its detail page" : "a stop from its arrival page"} and it will appear here.
      </p>
      <Link
        to="/home"
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-pill)] bg-primary px-5 text-sm font-medium text-on-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Explore nearby stops
      </Link>
    </section>
  );
}
